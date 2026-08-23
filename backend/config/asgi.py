"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chats.middleware import JWTAuthMiddleware
import chats.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # JWTAuthMiddleware (token di query string) di lapisan luar,
    # AuthMiddlewareStack (session cookie) sebagai fallback.
    "websocket": JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                chats.routing.websocket_urlpatterns
            )
        )
    ),
})