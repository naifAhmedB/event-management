from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPRecord
from .serializers import (
    LoginSerializer, RequestOTPSerializer, VerifyOTPSerializer,
    SetPasswordSerializer, ResetPasswordSerializer
)
from services.otp_service import OtpService
from apps.users.serializers import UserSerializer

User = get_user_model()


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'detail': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)

    return Response(_get_tokens(user))


@api_view(['POST'])
@permission_classes([AllowAny])
def request_otp_view(request):
    """Used for signup and forgot-password — determined by 'purpose' query param."""
    serializer = RequestOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    method = serializer.validated_data['method']
    purpose = request.data.get('purpose', 'signup')

    if purpose == 'signup' and User.objects.filter(phone=phone).exists():
        return Response({'detail': 'Phone already registered'}, status=status.HTTP_400_BAD_REQUEST)

    if purpose == 'forgot_password' and not User.objects.filter(phone=phone).exists():
        return Response({'detail': 'Phone not registered'}, status=status.HTTP_404_NOT_FOUND)

    code = OtpService.generate_code()
    OtpService.send_otp(phone, method, code, purpose)

    from datetime import timedelta
    otp = OTPRecord.objects.create(
        phone=phone,
        otp_code=code,
        otp_method=method,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    return Response({'detail': 'OTP sent', 'mock_code': code if __import__('django').conf.settings.MOCK_OTP else None})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    code = serializer.validated_data['code']

    otp = OTPRecord.objects.filter(phone=phone, otp_code=code, is_verified=False).order_by('-created_at').first()
    if not otp:
        return Response({'detail': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

    if otp.is_expired():
        return Response({'detail': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_verified = True
    otp.save()
    return Response({'verified': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def set_password_view(request):
    serializer = SetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    code = serializer.validated_data['code']
    password = serializer.validated_data['password']
    full_name = serializer.validated_data.get('full_name', '')

    otp = OTPRecord.objects.filter(
        phone=phone, otp_code=code, is_verified=True, purpose='signup'
    ).order_by('-created_at').first()
    if not otp:
        return Response({'detail': 'OTP not verified'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(phone=phone, password=password, full_name=full_name)
    return Response(_get_tokens(user), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """Alias: sends OTP with purpose=forgot_password."""
    data = request.data.copy()
    data['purpose'] = 'forgot_password'
    request._full_data = data
    return request_otp_view(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    code = serializer.validated_data['code']
    new_password = serializer.validated_data['new_password']

    otp = OTPRecord.objects.filter(
        phone=phone, otp_code=code, is_verified=True, purpose='forgot_password'
    ).order_by('-created_at').first()
    if not otp:
        return Response({'detail': 'OTP not verified'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password reset successfully'})
