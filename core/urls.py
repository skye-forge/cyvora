from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI / Swagger documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Versioned API — all citizen-facing endpoints live under api/v1/
    path("api/v1/", include("api.urls")),
    # Admin console (separate namespace, not under api/v1/)
    path("console/", include("apps.admin_console.urls")),
    # Legal resources direct for public sharing
    path("legal/", include("apps.legal_resources.urls")),
    # Payments webhooks (machine-to-machine, not citizen-facing)
    path("payments/", include("apps.payments.urls")),
    path("institutions/", include("apps.institutions.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    except ImportError:
        pass
