# 🚗 Car Rental Marketplace API

A production-ready NestJS backend for a Car Rental Marketplace with full RBAC, booking lifecycle management, double-booking prevention, JWT auth, Swagger docs, and Docker support.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | TypeORM 0.3 |
| Auth | JWT + Passport |
| Validation | class-validator |
| Docs | Swagger / OpenAPI |
| Containerisation | Docker + Compose |

---

## 📁 Project Structure

```
src/
├── auth/                   # JWT auth, strategies, login/register
│   ├── dto/auth.dto.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/                  # User CRUD, profile, password change
│   ├── dto/user.dto.ts
│   ├── entities/user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── roles/                  # RBAC module (decorators live in common/)
│   └── roles.module.ts
│
├── cars/                   # Car listings with filters & pagination
│   ├── dto/car.dto.ts
│   ├── entities/car.entity.ts
│   ├── cars.controller.ts
│   ├── cars.service.ts
│   └── cars.module.ts
│
├── bookings/               # Full booking lifecycle management
│   ├── dto/booking.dto.ts
│   ├── entities/booking.entity.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
│
├── payments/               # Payment structure (gateway-ready)
│   ├── dto/payment.dto.ts
│   ├── entities/payment.entity.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── payments.module.ts
│
├── uploads/                # Multer file upload (images)
│   ├── multer.config.ts
│   ├── uploads.controller.ts
│   ├── uploads.service.ts
│   └── uploads.module.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── interceptors/
│       ├── logging.interceptor.ts
│       └── transform.interceptor.ts
│
├── config/
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── database/
│   ├── data-source.ts
│   └── seeds/seed.ts
│
├── app.module.ts
└── main.ts
```

---

## 🚀 Quick Start

### Option 1 — Docker (recommended)

```bash
cp .env.example .env
docker-compose up -d
# API: http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
```

### Option 2 — Local

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure env
cp .env.example .env

# 3. Start PostgreSQL (Docker convenience)
docker-compose up postgres -d

# 4. Start the API in dev mode
npm run start:dev

# 5. (Optional) Run seed
npm run seed
```

---

## 🔐 Authentication

All endpoints require a Bearer JWT token unless marked `@Public()`.

```http
Authorization: Bearer <your_token>
```

### Register
```http
POST /api/v1/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "roles": ["USER"]   // optional, defaults to ["USER"]
}
```

### Login
```http
POST /api/v1/auth/login
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

---

## 👤 Roles

| Role | Capabilities |
|---|---|
| `USER` | Browse cars, create bookings, view own bookings, cancel own bookings |
| `LESSOR` | All USER perms + manage own car listings, approve/reject bookings for own cars |
| `ADMIN` | Full access to all resources |

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | JWT | Get current user |

### Cars
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/cars` | Public | List cars (filterable) |
| GET | `/cars/:id` | Public | Single car |
| GET | `/cars/my/listings` | LESSOR | My car listings |
| POST | `/cars` | LESSOR | Create car listing |
| PATCH | `/cars/:id` | LESSOR/ADMIN | Update car |
| POST | `/cars/:id/images` | LESSOR/ADMIN | Upload car images |
| DELETE | `/cars/:id` | LESSOR/ADMIN | Delete car |

**Car Filters** (query params):
- `brand`, `status`, `minPrice`, `maxPrice`, `location`
- `sortBy` (`pricePerDay` \| `createdAt` \| `brand` \| `year`)
- `sortOrder` (`ASC` \| `DESC`)
- `page`, `limit`

### Bookings
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/bookings` | USER | Create booking |
| GET | `/bookings` | ADMIN | All bookings |
| GET | `/bookings/my` | Any | My bookings |
| GET | `/bookings/my-cars` | LESSOR | Bookings for my cars |
| GET | `/bookings/:id` | Any | Single booking |
| PATCH | `/bookings/:id/status` | LESSOR/ADMIN | Approve/reject/complete |
| DELETE | `/bookings/:id/cancel` | USER | Cancel booking |

### Payments
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/payments` | Any | Create payment record |
| POST | `/payments/:id/process` | Any | Process payment (gateway hook) |
| GET | `/payments/:id` | Any | Get payment |
| GET | `/payments/booking/:bookingId` | Any | Payment for a booking |
| PATCH | `/payments/:id/status` | ADMIN | Update payment status |
| POST | `/payments/:id/refund` | ADMIN | Refund payment |

### Uploads
| Method | Endpoint | Description |
|---|---|---|
| POST | `/uploads/single` | Upload one image |
| POST | `/uploads/multiple` | Upload up to 10 images |

---

## 📦 Booking Lifecycle

```
PENDING
  ├─ → APPROVED   (by LESSOR/ADMIN)
  ├─ → REJECTED   (by LESSOR/ADMIN)
  └─ → CANCELLED  (by USER/ADMIN)

APPROVED
  ├─ → COMPLETED  (by LESSOR/ADMIN)
  └─ → CANCELLED  (by USER/ADMIN)
```

Double-booking is prevented at the service layer with an overlap query. Any booking that is not CANCELLED or REJECTED blocks the car's calendar.

---

## 🌱 Seed Data

```bash
npm run seed
```

Creates:
- 1 Admin · 2 Lessors · 2 Users
- 5 Cars across different brands/locations
- 3 Bookings in different statuses
- 2 completed Payments

Default password for all seeded users: **`Password123!`**

---

## 📚 Swagger Docs

Available at `http://localhost:3000/api/docs` once the server is running. Supports the **Authorize** button with your JWT token.

---

## 🔧 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USERNAME` | `postgres` | DB user |
| `DB_PASSWORD` | `postgres` | DB password |
| `DB_NAME` | `car_rental_db` | Database name |
| `JWT_SECRET` | — | **Change in production** |
| `JWT_EXPIRATION` | `7d` | Token TTL |
| `UPLOAD_DEST` | `./uploads` | Upload directory |
| `MAX_FILE_SIZE` | `5242880` | Max upload (bytes) |

---

## 🏭 Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production` (disables `synchronize`)
- [ ] Run migrations instead of `synchronize`
- [ ] Configure CORS `CORS_ORIGIN` to your frontend domain
- [ ] Add rate limiting (`@nestjs/throttler`)
- [ ] Integrate a real payment gateway (Stripe/PayPal) in `PaymentsService.processPayment()`
- [ ] Set up object storage (S3/GCS) for uploaded files
- [ ] Add email notifications for booking status changes
