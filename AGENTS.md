# E-Commerce Backend (Django)

## Setup & Quick Start

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows PowerShell activation
pip install -r requirements.txt
python manage.py migrate
```

### Running the Application

**HTTP Server (development):**
```bash
python manage.py runserver       # Port 8000 default
```

**WebSocket Server (separate terminal required):**
```bash
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```
⚠️ Both servers bind to port 8000 by default - run in separate terminals.

**Admin User:**
```bash
python manage.py createsuperuser
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

Base: `/api/v1/` | WebSocket: `ws://localhost:8000/ws/chat/{room_name}/`

| Endpoint | Method | Auth | Notes |
|----------|--------|------|-------|
| `/auth/register/` | POST | ❌ | Email/password registration, returns JWT |
| `/auth/login/` | POST | ❌ | Email+password or Google token login |
| `/auth/google/` | POST | ❌ | Google OAuth (ID token) login/register |
| `/auth/refresh/` | POST | ❌ | Refresh access token |
| `/auth/me/` | GET, PATCH | ✅ | Current user profile (edit name/phone/address/bio) |
| `/auth/admin/users/` | GET | 👑 | Admin: list users (filter `?role=`) |
| `/auth/admin/users/<id>/suspend/` | PATCH | 👑 | Admin: suspend/unsuspend user |
| `/stores/register/` | POST | ✅ | Seller registration, auto-approval by phone |
| `/stores/me/` | GET, PATCH | ✅ | Seller's own store info + edit |
| `/stores/user-by-name/` | GET | ✅ | Resolve seller user by store name |
| `/stores/admin/` | GET | 👑 | Admin: list all stores |
| `/stores/admin/<id>/status/` | PATCH | 👑 | Admin: change store status |
| `/products/` | GET, POST, PUT, DELETE | ⚠️ | CRUD products (POST/PUT/DELETE need active store) |
| `/orders/checkout/` | POST | ✅ | Create order + Midtrans Snap (or COD) |
| `/orders/` | GET | ✅ | Buyer order history (auto-sync Midtrans) |
| `/orders/store-orders/` | GET | ✅ | Seller: incoming orders |
| `/orders/<id>/` | GET | ✅ | Order detail (buyer/seller) |
| `/orders/<id>/pay/` | POST | ✅ | Regenerate Midtrans Snap for pending order |
| `/orders/<id>/ship/` | PATCH | ✅ | Seller: set courier/tracking/shipping status |
| `/orders/<id>/success/` | POST | ✅ | Buyer/seller: confirm COD payment |
| `/reviews/` | GET, POST | ✅ | Only on purchased/paid/COD orders |
| `/chats/send/` | POST | ✅ | Send chat message (also pushed via WebSocket) |
| `/chats/` | GET | ✅ | List chat rooms |
| `/admin/` | - | 👑 | Django admin interface |

Full API reference with curl examples: `API_DOCUMENTATION.md` (299 lines)

## Testing

```bash
python manage.py test <app_name>  # e.g., python manage.py test users, stores, products
```

- Each app uses standard Django test framework (`tests.py`)
- No pytest, Jest, or custom fixtures - Django test client only
- All models use UUID primary keys (not integers)

## Environment & Requirements

- **Python**: 3.12+
- **Database**: PostgreSQL `db_ecommerce` @ localhost:5432 (user: `postgres`)
- **Redis**: Required for production WebSocket channel layer (dev uses in-memory)
- **Environment vars**: See `backend/.env` for DB credentials, Midtrans keys, SECRET_KEY
- **Frontend**: React (Vite) SPA in `frontend/` (see `frontend/README.md`)

⚠️ `.env` contains sensitive data (DB passwords, API keys). Verify access before sharing.
