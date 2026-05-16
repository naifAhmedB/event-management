from django.urls import path
from apps.packages.views import (
    AdminPackageListCreateView, AdminPackageDetailView,
    AdminPromoListCreateView, AdminPromoDetailView,
)
from apps.users.views import AdminUserListView, AdminUserDetailView, admin_create_user_view
from apps.events.views import (
    AdminEventListView, AdminInviteeListCreateView, AdminInviteeDetailView,
    admin_assign_event_view, admin_stats_view,
)

urlpatterns = [
    path('stats/', admin_stats_view, name='admin-stats'),
    path('packages/', AdminPackageListCreateView.as_view(), name='admin-packages'),
    path('packages/<uuid:pk>/', AdminPackageDetailView.as_view(), name='admin-package-detail'),
    path('promos/', AdminPromoListCreateView.as_view(), name='admin-promos'),
    path('promos/<uuid:pk>/', AdminPromoDetailView.as_view(), name='admin-promo-detail'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/create/', admin_create_user_view, name='admin-user-create'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('events/', AdminEventListView.as_view(), name='admin-events'),
    path('events/<uuid:pk>/assign/', admin_assign_event_view, name='admin-event-assign'),
    path('events/<uuid:event_pk>/invitees/', AdminInviteeListCreateView.as_view(), name='admin-event-invitees'),
    path('events/<uuid:event_pk>/invitees/<uuid:pk>/', AdminInviteeDetailView.as_view(), name='admin-event-invitee-detail'),
]
