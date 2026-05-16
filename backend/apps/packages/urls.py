from django.urls import path
from . import views

urlpatterns = [
    path('', views.PackageListView.as_view(), name='package-list'),
    path('promo/validate/', views.validate_promo, name='promo-validate'),
]
