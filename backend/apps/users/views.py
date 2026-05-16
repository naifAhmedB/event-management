from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CustomUser
from .serializers import AdminUserSerializer
from .permissions import IsAdminUser


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(phone__icontains=search) | qs.filter(full_name__icontains=search)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_create_user_view(request):
    phone = request.data.get('phone', '').strip()
    full_name = request.data.get('full_name', '').strip()
    password = request.data.get('password', '').strip()
    if not phone or not password:
        return Response(
            {'detail': 'phone and password required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if CustomUser.objects.filter(phone=phone).exists():
        return Response(
            {'detail': 'phone_exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = CustomUser.objects.create_user(phone=phone, password=password, full_name=full_name)
    return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)
