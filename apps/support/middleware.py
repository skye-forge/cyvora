from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        validated = AccessToken(token)
        user_id = validated["user_id"]
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Authenticates WebSocket connections using the same JWT access tokens
    issued by the REST API (rest_framework_simplejwt).

    Flutter/web clients connect with the token as a query parameter:

        wss://api.varnis.cm/ws/support/<ticket_id>/?token=<access_token>

    Add to core/asgi.py:

        JWTAuthMiddleware(URLRouter(support.routing.websocket_urlpatterns))
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()

        return await super().__call__(scope, receive, send)
