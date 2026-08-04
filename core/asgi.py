import os
from channels.routing import ProtocolTypeRouter, URLRouter

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.production")

application = get_asgi_application()


# django_asgi_app must be created before importing anything that touches
# models (Channels routing imports consumers, which import models).
django_asgi_app = get_asgi_application()

from apps.support.middleware import JWTAuthMiddleware  # noqa: E402
from apps.support.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
