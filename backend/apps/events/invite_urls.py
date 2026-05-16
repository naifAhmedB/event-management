from django.urls import path
from .invite_views import invite_detail_view, invite_respond_view

urlpatterns = [
    path('<uuid:token>/', invite_detail_view, name='invite-detail'),
    path('<uuid:token>/respond/', invite_respond_view, name='invite-respond'),
]
