from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GuestPackage, PromoCode
from .serializers import (GuestPackageSerializer, PromoCodeSerializer,
                           AdminPackageSerializer, AdminPromoSerializer)
from apps.users.permissions import IsAdminUser


class PackageListView(generics.ListAPIView):
    queryset = GuestPackage.objects.filter(is_active=True)
    serializer_class = GuestPackageSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_promo(request):
    serializer = PromoCodeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code_str = serializer.validated_data['code']

    try:
        promo = PromoCode.objects.get(code__iexact=code_str, is_active=True)
    except PromoCode.DoesNotExist:
        return Response({'valid': False, 'detail': 'Invalid promo code'}, status=status.HTTP_404_NOT_FOUND)

    if promo.expires_at and timezone.now() > promo.expires_at:
        return Response({'valid': False, 'detail': 'Promo code expired'}, status=status.HTTP_400_BAD_REQUEST)

    if promo.used_count >= promo.max_uses:
        return Response({'valid': False, 'detail': 'Promo code exhausted'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'valid': True, 'discount': promo.discount_percent, 'code': promo.code})


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminPackageListCreateView(generics.ListCreateAPIView):
    queryset = GuestPackage.objects.all().order_by('price_sar')
    serializer_class = AdminPackageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminPackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GuestPackage.objects.all()
    serializer_class = AdminPackageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminPromoListCreateView(generics.ListCreateAPIView):
    queryset = PromoCode.objects.all().order_by('-created_at')
    serializer_class = AdminPromoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminPromoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PromoCode.objects.all()
    serializer_class = AdminPromoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
