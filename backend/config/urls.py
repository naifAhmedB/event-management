from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/packages/', include('apps.packages.urls')),
    path('api/admin/', include('config.admin_urls')),
    path('api/designs/', include('apps.events.design_urls')),
    path('api/invite/', include('apps.events.invite_urls')),
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
