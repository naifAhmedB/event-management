from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Invitee
from .serializers import PublicEventSerializer, InviteeSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def invite_detail_view(request, token):
    try:
        invitee = Invitee.objects.select_related('event__design').get(invite_token=token)
    except Invitee.DoesNotExist:
        return Response({'detail': 'Invalid invite link'}, status=status.HTTP_404_NOT_FOUND)

    event_data = PublicEventSerializer(invitee.event, context={'request': request}).data
    qr_url = None
    if invitee.qr_code_image:
        qr_url = request.build_absolute_uri(invitee.qr_code_image.url)

    return Response({
        'event': event_data,
        'guest_name': invitee.name,
        'response_status': invitee.response_status,
        'qr_code_url': qr_url,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def invite_respond_view(request, token):
    try:
        invitee = Invitee.objects.get(invite_token=token)
    except Invitee.DoesNotExist:
        return Response({'detail': 'Invalid invite link'}, status=status.HTTP_404_NOT_FOUND)

    response_choice = request.data.get('response')
    if response_choice not in ('accepted', 'declined'):
        return Response({'detail': 'response must be "accepted" or "declined"'}, status=status.HTTP_400_BAD_REQUEST)

    invitee.response_status = response_choice
    invitee.responded_at = timezone.now()
    invitee.save()

    qr_url = None
    if response_choice == 'accepted' and invitee.qr_code_image:
        qr_url = request.build_absolute_uri(invitee.qr_code_image.url)

    return Response({
        'detail': 'Response recorded',
        'response_status': invitee.response_status,
        'qr_code_url': qr_url,
        'location': invitee.event.location_text,
        'event_date': invitee.event.event_date,
    })
