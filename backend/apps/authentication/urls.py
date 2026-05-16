from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('signup/request-otp/', views.request_otp_view, name='auth-request-otp'),
    path('signup/verify-otp/', views.verify_otp_view, name='auth-verify-otp'),
    path('signup/set-password/', views.set_password_view, name='auth-set-password'),
    path('forgot-password/', views.forgot_password_view, name='auth-forgot-password'),
    path('reset-password/', views.reset_password_view, name='auth-reset-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
