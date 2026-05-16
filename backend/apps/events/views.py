import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Event, Invitee
from .serializers import EventSerializer, InviteeSerializer, AdminEventSerializer
from apps.users.permissions import IsAdminUser
from services.qr_service import QRService
from services.whatsapp_service import WhatsAppService
from services.payment_service import PaymentService
from utils.excel import generate_invitee_template


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Event.objects
                .filter(owner=self.request.user)
                .select_related('package', 'design', 'promo_code')
                .prefetch_related('invitees', 'guards'))

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (Event.objects
                .filter(owner=self.request.user)
                .select_related('package', 'design', 'promo_code')
                .prefetch_related('invitees', 'guards'))


class InviteeListCreateView(generics.ListCreateAPIView):
    serializer_class = InviteeSerializer
    permission_classes = [IsAuthenticated]

    def get_event(self):
        return Event.objects.get(pk=self.kwargs['event_pk'], owner=self.request.user)

    def get_queryset(self):
        return Invitee.objects.filter(event__pk=self.kwargs['event_pk'], event__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        event = self.get_event()
        data = request.data

        # Support bulk creation: list of {name, phone}
        if isinstance(data, list):
            created = []
            for item in data:
                inv = Invitee.objects.create(event=event, name=item['name'], phone=item['phone'])
                created.append(InviteeSerializer(inv).data)
            return Response(created, status=status.HTTP_201_CREATED)

        # Single creation
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InviteeDestroyView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invitee.objects.filter(event__owner=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invitee_template_view(request):
    return generate_invitee_template()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_view(request, pk):
    try:
        event = Event.objects.get(pk=pk, owner=request.user)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    if event.status not in ('draft', 'payment_pending'):
        return Response({'detail': 'Event already processed'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate price
    package_price = event.package.price_sar if event.package else 0
    total = PaymentService.calculate_total(package_price, event.promo_code)

    # Process payment
    result = PaymentService.process_payment(total, request.user, str(event.id))
    if not result['success']:
        event.status = 'payment_pending'
        event.save()
        return Response({'detail': 'Payment failed'}, status=status.HTTP_402_PAYMENT_REQUIRED)

    event.total_price_sar = total
    event.status = 'active'
    event.save()

    # Update promo code usage
    if event.promo_code:
        event.promo_code.used_count += 1
        event.promo_code.save()

    # Generate QR codes and send messages
    frontend_url = settings.FRONTEND_URL
    invitees = event.invitees.all()
    for inv in invitees:
        if event.include_qr:
            QRService.generate_invite_qr(inv)
        inv.sent_at = timezone.now()
        inv.save()

        # Send invitation
        invite_url = f"{frontend_url}/invite/{inv.invite_token}"
        if event.delivery_method == 'whatsapp':
            WhatsAppService.send_invitation(inv.phone, inv.name, event.title, invite_url, event.message_language)
        elif event.delivery_method == 'email':
            WhatsAppService.send_email_invitation(inv.phone, inv.name, event.title, invite_url, event.message_language)
        else:
            WhatsAppService.send_sms(inv.phone, inv.name, event.title, invite_url, event.message_language)
        inv.message_sent = True
        inv.save()

    return Response(EventSerializer(event, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_view(request, pk):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    # Allow owner or guards
    if event.owner != request.user and not event.guards.filter(pk=request.user.pk).exists():
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if not event.is_active:
        return Response({'valid': False, 'detail': 'Event is deactivated'})

    token = request.data.get('token')
    if not token:
        return Response({'detail': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        invitee = Invitee.objects.get(invite_token=token, event=event)
    except Invitee.DoesNotExist:
        return Response({'valid': False, 'detail': 'Invalid token'}, status=status.HTTP_404_NOT_FOUND)

    if invitee.response_status != 'accepted':
        return Response({'valid': False, 'detail': 'Guest has not accepted', 'guest_name': invitee.name})

    if invitee.arrived:
        return Response({'valid': False, 'already_arrived': True, 'guest_name': invitee.name})

    invitee.arrived = True
    invitee.arrived_at = timezone.now()
    invitee.save()
    return Response({'valid': True, 'guest_name': invitee.name, 'already_arrived': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remind_view(request, pk):
    event = get_object_or_404(Event, pk=pk, owner=request.user)
    message = request.data.get('message', '')
    waiting = event.invitees.filter(response_status='waiting')
    count = waiting.count()
    frontend_url = settings.FRONTEND_URL
    for inv in waiting:
        invite_url = f"{frontend_url}/invite/{inv.invite_token}"
        WhatsAppService.send_reminder(
            inv.phone, inv.name, event.title, invite_url, message, event.message_language
        )
    event.reminder_count += count
    event.save()
    available = None
    if event.package:
        used = event.invitees.count() + event.reminder_count
        available = max(0, event.package.max_guests - used)
    return Response({'sent': count, 'available_invitations': available})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_guard_view(request, pk):
    event = get_object_or_404(Event, pk=pk, owner=request.user)
    phone = request.data.get('phone', '').strip()
    if not phone:
        return Response({'detail': 'phone required'}, status=status.HTTP_400_BAD_REQUEST)
    User = get_user_model()
    password = secrets.token_urlsafe(8)
    user, created = User.objects.get_or_create(phone=phone, defaults={'full_name': 'Guard'})
    user.set_password(password)
    user.save()
    event.guards.add(user)
    WhatsAppService.send_guard_credentials(phone, password, event.title)
    return Response({'success': True, 'phone': phone})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_guard_view(request, pk, guard_pk):
    event = get_object_or_404(Event, pk=pk, owner=request.user)
    User = get_user_model()
    try:
        guard = User.objects.get(pk=guard_pk)
    except User.DoesNotExist:
        return Response({'detail': 'Guard not found'}, status=status.HTTP_404_NOT_FOUND)
    event.guards.remove(guard)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminEventListView(generics.ListAPIView):
    serializer_class = AdminEventSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = (Event.objects.all()
              .select_related('owner')
              .prefetch_related('invitees')
              .order_by('-created_at'))
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(title__icontains=search)
        owner_ids = self.request.query_params.getlist('owner')
        if owner_ids:
            qs = qs.filter(owner__in=owner_ids)
        return qs


class AdminInviteeListCreateView(generics.ListCreateAPIView):
    serializer_class = InviteeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return Invitee.objects.filter(event_id=self.kwargs['event_pk']).order_by('name')

    def perform_create(self, serializer):
        event = get_object_or_404(Event, pk=self.kwargs['event_pk'])
        serializer.save(event=event)


class AdminInviteeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InviteeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return Invitee.objects.filter(event_id=self.kwargs['event_pk'])


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_assign_event_view(request, pk):
    event = get_object_or_404(Event, pk=pk)
    owner_id = request.data.get('owner_id', '').strip()
    if not owner_id:
        return Response({'detail': 'owner_id required'}, status=status.HTTP_400_BAD_REQUEST)
    User = get_user_model()
    owner = get_object_or_404(User, pk=owner_id)
    event.owner = owner
    event.save(update_fields=['owner'])
    return Response(AdminEventSerializer(event).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_stats_view(request):
    from apps.packages.models import GuestPackage
    User = get_user_model()
    return Response({
        'total_users': User.objects.count(),
        'total_events': Event.objects.count(),
        'active_events': Event.objects.filter(status='active').count(),
        'total_packages': GuestPackage.objects.filter(is_active=True).count(),
    })
