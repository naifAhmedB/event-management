from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EventDesign
from .serializers import EventDesignSerializer


class DesignListView(generics.ListAPIView):
    serializer_class = EventDesignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_type = self.request.query_params.get('event_type')
        qs = EventDesign.objects.filter(is_premade=True)
        if event_type:
            qs = qs.filter(event_type=event_type)
        # Also include user's own designs
        user_designs = EventDesign.objects.filter(is_premade=False, owner=self.request.user)
        if event_type:
            user_designs = user_designs.filter(event_type=event_type)
        return (qs | user_designs).distinct()


class DesignUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('image')
        event_type = request.data.get('event_type', 'birthday')
        name = request.data.get('name', '')

        if not image:
            return Response({'detail': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        design = EventDesign.objects.create(
            event_type=event_type,
            name_en=name,
            is_premade=False,
            owner=request.user,
            design_image=image,
            text_positions={
                'name': {'x': 50, 'y': 40},
                'date': {'x': 50, 'y': 55},
                'location': {'x': 50, 'y': 65},
                'welcome': {'x': 50, 'y': 25},
            }
        )
        return Response(EventDesignSerializer(design, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)
