# 📚 API Documentation - E-Commerce Backend

## 🔧 **Frontend Integration Setup**

### Base URLs (Development):
```
HTTP API: http://localhost:8000/api/v1/
WebSocket: ws://localhost:8000/ws/chat/{room_name}/
Admin Panel: http://localhost:8000/admin/
```

### CORS Configuration Required:
Backend harus diatur CORS di `settings.py`:

```python
# config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React/Vite default port
    "http://localhost:5173",  # Vue/Nuxt default port  
    "http://localhost:8080",  # Angular default port
]

# Atau untuk development saja (temporary):
# CORS_ALLOW_ALL_ORIGINS = True
```

### Authentication Header:
Semua endpoint yang memerlukan login menggunakan JWT token:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 🔐 **Auth (User Authentication)**
**Base URL:** `/api/v1/auth/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/google-auth/` | Login dengan Google OAuth (simulasi) atau instant login |

**Request Body:**
```json
{
  "email": "user@example.com",
  "google_id": "google-user-id-123"
}
```

**Response:**
```json
{
  "status": "success",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "user",
    "role": "buyer"
  }
}
```

---

## 🏪 **Stores (Registrasi Toko Penjual)**
**Base URL:** `/api/v1/stores/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/stores/register-seller/` | Daftarkan toko sebagai penjual baru | ✅ Yes |

**Request Body:**
```json
{
  "store_name": "Toko Keren Saya",
  "phone": "081234567890",
  "address": "Jl. Sudirman No. 123, Jakarta"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pendaftaran toko berhasil diproses.",
  "store_status": "active" // atau "pending_review"
}
```

**⚠️ Catatan Penting:**
- Phone harus dimulai dengan '08' dan minimal 10 karakter → akan otomatis **approved** (`active`)
- Jika nomor HP mencurigakan (tidak mulai dengan '08' atau kurang dari 10 karakter) → **pending review** admin

---

## 🛍️ **Products (Produk)**
**Base URL:** `/api/v1/products/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/products/` | Daftar semua produk aktif |
| `GET` | `/api/v1/products/{id}/` | Detail produk tertentu |
| `POST` | `/api/v1/products/` | Buat produk baru (hanya seller) |
| `PUT` | `/api/v1/products/{id}/` | Update produk |
| `DELETE` | `/api/v1/products/{id}/` | Hapus produk |

**Model Product:**
```python
{
    "id": "uuid",
    "store": "store_uuid",      # Referensi ke store
    "name": "Nama Produk",      # max 255 char, db_index
    "price": 100000.00,         # Decimal 12 digit, 2 desimal
    "stock": 50,                # Positive integer
    "is_active": true,          # Boolean
    "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 🛒 **Orders (Pesanan)**
**Base URL:** `/api/v1/orders/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/orders/` | Daftar pesanan saya | ✅ Yes |
| `GET` | `/api/v1/orders/{id}/` | Detail pesanan | ✅ Yes |
| `POST` | `/api/v1/orders/` | Buat pesanan baru | ✅ Yes |
| `PUT` | `/api/v1/orders/{id}/` | Update status pesanan | Seller/Admin |

**Model Order:**
```python
{
    "id": "uuid",
    "buyer": "user_uuid",               # Pembeli
    "store": "store_uuid",              # Toko penjual
    "product": "product_uuid",          # Produk yang dibeli
    "quantity": 2,                      # Jumlah
    "total_price": 200000.00,           # Total harga
    
    "payment_method": "midtrans",       # midtrans / cod
    "payment_status": "pending",        # pending/paid/failed/expired
    "shipping_status": "pending",       # pending/shipped/delivered
    
    "courier_name": "JNE",             # Opsional
    "tracking_number": "JNE123456",    # Opsional
    
    "created_at": "2024-01-01T00:00:00Z"
}
```

**Payment Methods:**
- `midtrans` - Midtrans Payment Gateway
- `cod` - Cash On Delivery

**Payment Status Flow:**
```
PENDING → PAID (berhasil bayar)
         → FAILED (gagal bayar)
         → EXPIRED (kadaluarsa)
```

**Shipping Status Flow:**
```
PENDING → SHIPPED → DELIVERED
```

---

## ⭐ **Reviews (Ulasan Produk)**
**Base URL:** `/api/v1/reviews/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/reviews/` | Daftar ulasan produk | ✅ Yes |
| `POST` | `/api/v1/reviews/` | Buat ulasan produk | ✅ Yes |

**Model Review:**
```python
{
    "id": "uuid",
    "order": "order_uuid",            # Harus linked ke order yang sudah dibayar
    "product": "product_uuid",        # Produk yang diulas
    "user": "user_uuid",              # Reviewer (harus pembeli)
    "rating": 5,                      # Integer 1-5
    "comment": "Produk bagus sekali!",
    "created_at": "2024-01-01T00:00:00Z"
}
```

**⚠️ Business Rules:**
- User hanya bisa review produk yang pernah mereka beli (via completed order)
- Rating maksimal 5 bintang, minimal 1 bintang
- Satu order = satu review (One-to-One relationship dengan Order)

---

## 💬 **Chats (Real-time Messaging)**
**WebSocket Endpoint:** `/ws/chat/{room_name}/`

**Consumer:** `chats.consumers.ChatConsumer`

### Cara Connect WebSocket (Frontend Example):

```javascript
// Connect ke room chat
const ws = new WebSocket('wss://your-domain.com/ws/chat/user_{target_user_id}/');

ws.onopen = function() {
  console.log('Connected to chat');
};

// Kirim pesan
ws.send(JSON.stringify({
  message: "Halo, ini pesan test!",
  sender_id: "current-user-uuid",
  receiver_id: "target-user-uuid"
}));

// Terima pesan
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Message received:', data.message, 'from', data.sender_id);
};
```

**Flow Pesan:**
1. Client kirim pesan via WebSocket
2. Server simpan ke database `Chat` model
3. Server broadcast pesan ke room group target
4. Receiver terima pesan real-time

**Model Chat:**
```python
{
    "id": "uuid",
    "sender": "user_uuid",      # Pengirim
    "receiver": "user_uuid",    # Penerima
    "message": "Pesan text here",
    "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🎯 **Django Admin**
**URL:** `/admin/`

Akses panel admin Django untuk manage semua data. Perlu membuat superuser terlebih dahulu:

```bash
python manage.py createsuperuser
```

---

## 📊 **Quick Reference Table**

| Module | Base URL | Auth Needed? | Primary Use Case |
|--------|----------|--------------|------------------|
| Auth | `/api/v1/auth/` | ❌ No | Login/Register |
| Stores | `/api/v1/stores/` | ✅ Yes | Registrasi Toko |
| Products | `/api/v1/products/` | ⚠️ Partial | CRUD Produk |
| Orders | `/api/v1/orders/` | ✅ Yes | Buat & Track Order |
| Reviews | `/api/v1/reviews/` | ✅ Yes | Berikan Ulasan |
| Chats | `/ws/chat/{room}/` | ✅ Yes | Real-time Chat |

---

## 🔑 **Authentication Flow**

1. **Buyer Sign Up/Login** → Google OAuth simulation → Get JWT tokens
2. **Seller Onboarding** → Register via `/api/v1/stores/register-seller/` → Auto-approved if phone valid
3. **All protected endpoints** → Include `Authorization: Bearer <access_token>` header

---

## 🚀 **Testing dengan curl**

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/google-auth/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","google_id":"google123"}'

# Register Store (after login)
curl -X POST http://localhost:8000/api/v1/stores/register-seller/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"store_name":"My Shop","phone":"081234567890","address":"Jakarta"}'

# Create Product (seller only)
curl -X POST http://localhost:8000/api/v1/products/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sepatu Nike","price":500000,"stock":100,"store":"store-uuid"}'

# Create Order (buyer)
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product":"product-uuid",
    "quantity":2,
    "payment_method":"midtrans"
  }'

# Post Review
curl -X POST http://localhost:8000/api/v1/reviews/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order":"order-uuid",
    "product":"product-uuid",
    "rating":5,
    "comment":"Baru excellent!"
  }'
```

---

Semoga membantu! Jangan ragu kalau ada yang mau ditanyakan tentang API ini. 😊

**Happy Coding!** 🎉
