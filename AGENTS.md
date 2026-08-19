# E-Commerce (Django backend + React frontend)

## Setup

Venv lives at repo **root** (`./.venv/`), not under `backend/`.

```powershell
# repo root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
# PostgreSQL must be running: db_ecommerce @ localhost:5432, user postgres
cd backend
python manage.py migrate
python manage.py createsuperuser
```

Env file is `backend/.env` (gitignored). Required keys (see `config/settings.py`):
`SECRET_KEY` (falls back to a dev key only when `DEBUG=True`), `DEBUG`, `ALLOWED_HOSTS`,
`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
`CORS_ALLOWED_ORIGINS` (default `http://localhost:5173,http://127.0.0.1:5173`).

## Running the backend

```bash
python manage.py runserver     # from backend/
```

`daphne` is first in `INSTALLED_APPS`, so `runserver` is replaced by Daphne's ASGI runner —
it serves **both HTTP and WebSocket on :8000 in one command**. Do NOT also start a separate
`daphne ... -p 8000` process (port conflict). For an explicit ASGI server:
`daphne -b 0.0.0.0 -p 8000 config.asgi:application`.

## Running the frontend

```bash
cd frontend
npm install
npm run dev      # Vite, http://localhost:5173
npm run build    # production build (Dockerfile: node build -> nginx:alpine SPA)
npm run lint
```

Frontend talks to backend via `src/services/api.js`, which hardcodes `http://127.0.0.1:8000/api/v1`,
attaches `Bearer` from `localStorage.access_token`, and redirects to `/login` on 401. No test script.

## Stack versions (installed)

Django 6.1, DRF 3.18.0, djangorestframework-simplejwt 5.5.1, Channels 4.3.2, Daphne 4.2.3,
PostgreSQL (psycopg2-binary). React 19 + Vite 8 + Tailwind 4 + react-router 7 + axios.

## Architecture

Modular monolith. Apps (in `INSTALLED_APPS`): `users`, `stores`, `products`, `orders`,
`reviews`, `chats`. Plus `core` — see "Dead code" below.

| App | Responsibility |
|-----|----------------|
| `users` | Custom `User` (AbstractUser), `email` = `USERNAME_FIELD`, `role` choices admin/seller/buyer, JWT auth, simulated Google login |
| `stores` | `Store` (OneToOne→User), seller registration, store CRUD |
| `products` | `Product` catalog, stock, active flag |
| `orders` | `Order` with Midtrans/COD payment + shipping status |
| `reviews` | `Review` (OneToOne→Order) |
| `chats` | WebSocket consumer + `Chat` model |

- URL root: `config/urls` → all API under `/api/v1/`. ASGI root: `config.asgi` (ProtocolTypeRouter, websocket→`chats.routing`).
- Every model uses `UUIDField` primary key (`DEFAULT_AUTO_FIELD` is `BigAutoField` but each model overrides `id`). Pass UUIDs in URLs/tests, not ints.
- `AUTH_USER_MODEL = 'users.User'`. `TIME_ZONE = 'Asia/Jakarta'`, `USE_TZ = True`.
- Channel layer is `InMemoryChannelLayer` (dev only; Redis needed for production, despite `redis`/`django-redis` being installed).

## Actual API routes (verified from urls.py)

Base: `/api/v1/` | WebSocket: `ws://localhost:8000/ws/chat/{room_name}/`

- `auth/` → `register/` POST, `login/` POST (JWT pair), `refresh/` POST, `google/` POST (simulated OAuth), `me/` GET
- `stores/` → ViewSet (`/`, `/<pk>/`) + `register/` POST (extra action)
- `products/` → `/` GET(public)/POST(auth), `/<pk>/` GET/PUT/DELETE
- `orders/` → `checkout/` POST, `/` GET (buyer's or seller's store orders), `store-orders/` GET,
  `/<pk>/` GET, `/<pk>/cancel/` PATCH (UpdateAPIView — bukan POST!)
- `reviews/` → ViewSet (`/`, `/<pk>/`); filter `?product=<uuid>`
- WebSocket only: `ws/chat/<room_name>/` via `chats.consumers.ChatConsumer`

`API_DOCUMENTATION.md` (330 lines) has curl examples but predates some code; trust the code over it.

## Behavior gotchas (differ from older docs / aren't enforced in code)

1. **Seller registration never auto-approves.** `stores.views.StoreViewSet.register` always sets
   `status='PENDING_REVIEW'`. The "auto-approve if phone starts with `08`" logic exists ONLY in the
   dead `core` app (see below) and is not active.
2. **Reviews don't verify purchase.** `ReviewViewSet.perform_create` blocks duplicate reviews per
   product but does NOT check that the reviewer bought / paid for the product. The `order` FK on
   `Review` is never validated against the requesting user or payment status.
3. **Midtrans is not actually integrated.** `midtransclient` + keys are configured, but
   `CheckoutView` only has a `# TODO: Integrate Midtrans` placeholder returning `payment_url: '/payment/start'`.
4. **Product update/delete is unauthenticated.** `ProductDetailView` (RetrieveUpdateDestroyAPIView)
   sets no `permission_classes`, so PUT/DELETE default to `AllowAny`. Only `ProductListCreateView` POST
   requires auth + that the user owns a store (it checks `hasattr(user, 'store')` but not store status).
5. **`stores/urls.py` has a dead duplicate `register/` route.** Both the `StoreViewSet` router `@action`
   and an explicit `path('register/', SellerStoreView.as_view({'post':'register'}))` map the same URL.
   The router pattern is listed first, so `StoreViewSet.register` handles `/api/v1/stores/register/`; the
   explicit route is unreachable (and would be invalid anyway — `SellerStoreView` has no `register` method).
6. **`Review.order` is now nullable** (migration `0004_alter_review_order`). Reviews can be created with
   only `product` + `rating` + `comment`; the `order` FK is optional and never validated against the
   buyer/payment status. Duplicate-per-product is enforced in both `ReviewSerializer.validate` and
   `ReviewViewSet.perform_create`.
7. **`orders/urls.py` ordering matters**: `store-orders/` MUST be declared before `<str:pk>/` (it was
   shadowed by the pk pattern → 404; fixed).
8. **`ProductCreateSerializer` returns `id`** in POST response (needed by callers).
9. **Midtrans `_create_snap_token` swallows exceptions but logs them** via `logger.exception` — check
   server console when checkout returns `message` about failing to generate a token. Midtrans sandbox
   API is flaky; a transient failure is common.
10. **Google login is now REAL OAuth 2.0** (Google Identity Services + `google-auth` verification):
    frontend `GoogleLoginButton.jsx` renders the official GSI button (needs `VITE_GOOGLE_CLIENT_ID`),
    backend `GoogleAuthView` verifies the ID token (needs `GOOGLE_CLIENT_ID`; rejects fake tokens with
    401). Placeholders in both `.env` files → button shows a "not set" notice, app still works.
11. **`tests.py` files are empty stubs** — `manage.py test` reports "Found 0 tests". Don't rely on them.

## Dead / mismatched code (don't trust it)

- **`core/` app** is in `INSTALLED_APPS` but NOT routed in `config/urls.py`, has an **empty `models.py`**,
  no migrations, and its `views.py`/`serializers.py` do `from .models import User, Store` (would raise
  `ImportError` if imported). It duplicates `users`/`stores` logic (incl. the phone auto-approve).
  Treat `core/` as stale/dead — the live behavior is in `users`/`stores`.
- **`chats` HTTP endpoints are unrouted.** `chats/urls.py` (`ChatViewSet`) is NOT included in
  `config/urls.py`, so any HTTP `chats/` call 404s. The WebSocket consumer IS wired and works.
- **`ChatWidget.jsx` (dipakai) sudah benar**: connect ke `ws://localhost:8000/ws/chat/room_<user.id>/`
  via `VITE_WS_BASE_URL` (default `ws://localhost:8000/ws`). Consumer menerima JSON
  `{message, sender_id, receiver_id}`. **Catatan**: consumer TIDAK mengautentikasi user —
  siapa pun bisa join room mana pun. (Bug lama: regex routing `\w+` menolak UUID ber-strip —
  sudah diganti `[\w-]+`; tanpa fix ini chat TIDAK PERNAH connect karena semua user UUID.)
- **`chatService.js` adalah dead code** (diekspor `services/index.js`, tidak dipakai komponen mana pun);
  HTTP `/chats/*`-nya 404 (unrouted), tapi `chatWebSocket` sudah diperbaiki ke format URL yang benar.

## Installed-but-unused dependencies

`requirements.txt` is aspirational, not a true lockfile. These are installed but NOT wired anywhere
(no settings/urls/imports): `celery`/`kombu`/`redis`/`django-redis` (no Celery config; channel layer
is InMemory), `django-allauth`/`dj-rest-auth` (custom `GoogleAuthView` simulates OAuth instead),
`drf-spectacular` (no schema route, not in `INSTALLED_APPS`), `django-filter` (not in `INSTALLED_APPS`),
`PyMySQL` (DB is PostgreSQL), `pillow`, `qrcode`. **Trust `config/settings.py` + `config/urls.py` + views
over `requirements.txt` to determine what the app actually uses.**

## Testing

```bash
cd backend
python manage.py test <app>        # users | stores | products | orders | reviews | chats
```

Standard Django test framework only (no pytest/fixtures). Each app has `tests.py`. Use UUIDs for PKs
in test fixtures and URL kwargs, not integers. No frontend tests, no CI workflows, no pre-commit hooks.
