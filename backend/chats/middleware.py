import urllib.parse
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


@database_sync_to_async
def _get_user_from_token(token):
    """Validate JWT and return the matching active user."""
    try:
        access_token = AccessToken(token)
        user_id = access_token.get('user_id')
        return User.objects.get(id=user_id, is_active=True)
    except (TokenError, User.DoesNotExist, ValueError):
        return AnonymousUser()


class JWTAuthMiddleware:
    """Authenticate WebSocket connections via ?token=<JWT> query parameter."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope['user'] = await self._resolve_user(scope)
        return await self.app(scope, receive, send)

    async def _resolve_user(self, scope):
        query_string = scope.get('query_string', b'')
        if not isinstance(query_string, str):
            query_string = query_string.decode('utf-8', errors='ignore')
        params = urllib.parse.parse_qs(query_string)
        tokens = params.get('token', [None])
        token = tokens[0]
        if not token:
            return AnonymousUser()
        return await _get_user_from_token(token)
