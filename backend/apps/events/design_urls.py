from django.urls import path
from .design_views import DesignListView, DesignUploadView

urlpatterns = [
    path('', DesignListView.as_view(), name='design-list'),
    path('upload/', DesignUploadView.as_view(), name='design-upload'),
]
