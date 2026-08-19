# E-Commerce Backend (Django)

## Quick Start Commands
```bash
cd backend
python manage.py migrate          # Run migrations
python manage.py runserver        # Start dev server
```

## Architecture Overview

**Modular monolith Django 6.1 backend with:**
- PostgreSQL database (`db_ecommerce` @ localhost:5432)
- JWT authentication via `djangorestframework-simplejwt`
- Django Channels for WebSockets (in-memory channel layer in dev)
- Daphne ASGI server for async WebSocket support

**Apps & Responsibilities:**
| App | Purpose |
|-----|---------|
| `users` | Custom User model (AbstractUser), email-based auth, Google OAuth simulation |
| `stores` | Seller store registration with automatic review status based on phone validation |
| `products` | Product catalog, inventory tracking |
| `orders` | Order management with Midtrans payment gateway integration |
| `reviews` | Product reviews linked to completed orders |
| `chats` | Real-time messaging via WebSocket (`/ws/chat/{room_name}/`) |

**Key Entry Points:**
- Main URLs: `config.urls` → includes `/api/v1/*` routes for each app
- ASGI/WebSocket: `config.asgi.application` with chat routing in `chats.routing`

## Framework/Toolchain Quirks

1. **Custom User Model**: Uses `email` as `USERNAME_FIELD`, `role` choices (admin/seller/buyer)
2. **UUID Primary Keys**: All models use UUID by default
3. **Hybrid Onboarding**: Seller registration auto-approves if phone starts with '08' and >=10 chars; otherwise pending review
4. **WebSocket Setup**: 
   - In-memory channel layer (dev only) - needs Redis for production
   - Consumer at `chats.consumers.ChatConsumer`
   - URL pattern: `r'ws/chat/(?P<room_name>\w+)/$'`
5. **Midtrans Integration**: Server key configured in settings (`MIDTRANS_SERVER_KEY`), currently in test mode

## API Structure
```
/api/v1/auth/    → users.urls (GoogleAuthView)
/api/v1/stores/  → stores.urls (RegisterSellerView)  
/api/v1/products/→ products.urls
/api/v1/orders/  → orders.urls
/admin/          → Django admin (requires superuser via createsuperuser)
```

## Testing Notes
- Each app has its own `tests.py` module
- No pytest or custom fixtures detected - standard Django test client used
- Tests run via: `python manage.py test <app_name>`

## Environment/Setup Requirements
- Python 3.12+
- Virtual environment at `.venv`
- PostgreSQL instance running locally on port 5432 with user `postgres`
- Docker not detected - no containerized setup
