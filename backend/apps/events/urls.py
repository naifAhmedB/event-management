from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListCreateView.as_view(), name='event-list'),
    path('<uuid:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    path('<uuid:event_pk>/invitees/', views.InviteeListCreateView.as_view(), name='invitee-list'),
    path('<uuid:event_pk>/invitees/<uuid:pk>/', views.InviteeDestroyView.as_view(), name='invitee-destroy'),
    path('invitee-template/', views.invitee_template_view, name='invitee-template'),
    path('<uuid:pk>/checkout/', views.checkout_view, name='event-checkout'),
    path('<uuid:pk>/scan/', views.scan_view, name='event-scan'),
    path('<uuid:pk>/remind/', views.remind_view, name='event-remind'),
    path('<uuid:pk>/guards/', views.add_guard_view, name='event-add-guard'),
    path('<uuid:pk>/guards/<uuid:guard_pk>/', views.remove_guard_view, name='event-remove-guard'),
]
