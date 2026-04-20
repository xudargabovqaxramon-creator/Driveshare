# DriveShare — Backend Audit & Frontend Architecture

---

## 1. BACKEND AUDIT

### Tech Stack
- Framework: NestJS (Node.js)
- Database: PostgreSQL via TypeORM
- Auth: JWT (Bearer token, no refresh token — single access token pattern)
- File uploads: Multer (local `/uploads` directory)
- API prefix: `api/v1`
- Response envelope: `{ data, statusCode, timestamp }` via TransformInterceptor

---

### Entities & Data Models

#### User
| Field       | Type            | Notes                        |
|-------------|-----------------|------------------------------|
| id          | UUID            | Primary key                  |
| name        | string(100)     |                              |
| email       | string(255)     | Unique                       |
| password    | string          | Excluded from serialization  |
| roles       | UserRole[]      | Array enum (USER/LESSOR/ADMIN)|
| isActive    | boolean         | Default true                 |
| createdAt   | timestamp       |                              |
| deletedAt   | timestamp\|null | Soft delete                  |

#### Car
| Field        | Type       | Notes                            |
|--------------|------------|----------------------------------|
| id           | UUID       |                                  |
| name         | string(150)|                                  |
| brand        | string(100)|                                  |
| description  | text       | nullable                         |
| pricePerDay  | decimal    | precision(10,2)                  |
| status       | CarStatus  | available / booked / maintenance |
| images       | string[]   | simple-array of paths            |
| location     | string     | nullable                         |
| year         | int        | nullable                         |
| seats        | int        | nullable                         |
| transmission | string     | nullable (automatic/manual)      |
| ownerId      | UUID FK    | → users                          |
| deletedAt    | timestamp  | Soft delete                      |

#### Booking
| Field           | Type          | Notes                                       |
|-----------------|---------------|---------------------------------------------|
| id              | UUID          |                                             |
| userId          | UUID FK       | → users                                     |
| carId           | UUID FK       | → cars                                      |
| startDate       | date          |                                             |
| endDate         | date          |                                             |
| totalPrice      | decimal(10,2) | Calculated server-side (days × pricePerDay) |
| status          | BookingStatus | See state machine below                     |
| notes           | text          | nullable                                    |
| rejectionReason | text          | nullable                                    |

**Booking Status State Machine:**
```
PENDING → AWAITING_PAYMENT  (lessor approves)
PENDING → REJECTED           (lessor rejects)
PENDING → CANCELLED          (user cancels)
AWAITING_PAYMENT → APPROVED  (payment confirmed)
AWAITING_PAYMENT → CANCELLED
AWAITING_PAYMENT → REJECTED
APPROVED → COMPLETED
APPROVED → CANCELLED
```

#### Payment
| Field         | Type          | Notes                                       |
|---------------|---------------|---------------------------------------------|
| id            | UUID          |                                             |
| bookingId     | UUID FK       | → bookings (1:1)                            |
| amount        | decimal(10,2) |                                             |
| status        | PaymentStatus | pending/processing/completed/failed/refunded|
| provider      | PaymentProvider| stripe/paypal/manual                       |
| transactionId | string        | nullable                                    |
| metadata      | jsonb         | nullable                                    |
| paidAt        | timestamp     | nullable                                    |

**Key rule:** Payment can only be initiated when booking.status === `awaiting_payment`

#### Notification
| Field           | Type             | Notes                        |
|-----------------|------------------|------------------------------|
| id              | UUID             |                              |
| userId          | UUID FK          | → users                      |
| message         | text             |                              |
| type            | NotificationType |                              |
| isRead          | boolean          | Default false                |
| relatedEntity   | string           | nullable e.g. 'Booking'      |
| relatedEntityId | string           | nullable — for deep links    |

---

### API Endpoints Summary

#### Auth  (`/auth`)
| Method | Path        | Auth | Roles  | Notes                    |
|--------|-------------|------|--------|--------------------------|
| POST   | /register   | No   | —      | Rate: 10/min             |
| POST   | /login      | No   | —      | Rate: 5/min              |
| GET    | /me         | Yes  | Any    | Returns full user object |

#### Users (`/users`)
| Method | Path        | Auth | Roles        |
|--------|-------------|------|--------------|
| GET    | /           | Yes  | ADMIN        |
| GET    | /me         | Yes  | Any          |
| PATCH  | /me         | Yes  | Any          |
| PATCH  | /me/password| Yes  | Any          |
| GET    | /:id        | Yes  | ADMIN        |
| PATCH  | /:id        | Yes  | ADMIN        |
| DELETE | /:id        | Yes  | ADMIN / self |

#### Cars (`/cars`)
| Method | Path            | Auth | Roles          |
|--------|-----------------|------|----------------|
| GET    | /               | No   | —              |
| GET    | /:id            | No   | —              |
| GET    | /my/listings    | Yes  | LESSOR, ADMIN  |
| POST   | /               | Yes  | LESSOR, ADMIN  |
| PATCH  | /:id            | Yes  | LESSOR, ADMIN  |
| POST   | /:id/images     | Yes  | LESSOR, ADMIN  |
| DELETE | /:id            | Yes  | LESSOR, ADMIN  |
| POST   | /:id/restore    | Yes  | ADMIN          |

#### Bookings (`/bookings`)
| Method | Path            | Auth | Roles          | Notes                       |
|--------|-----------------|------|----------------|-----------------------------|
| POST   | /               | Yes  | USER, ADMIN    | Rate: 5/min                 |
| GET    | /               | Yes  | ADMIN          | All bookings                |
| GET    | /my             | Yes  | Any            | Current user's bookings     |
| GET    | /my-cars        | Yes  | LESSOR, ADMIN  | Bookings for lessor's cars  |
| GET    | /:id            | Yes  | Any            |                             |
| PATCH  | /:id/status     | Yes  | LESSOR, ADMIN  | Status transition           |
| POST   | /:id/cancel     | Yes  | Any            | Booking owner cancels       |
| DELETE | /:id            | Yes  | Owner, ADMIN   | Soft delete                 |

#### Payments (`/payments`)
| Method | Path                   | Auth | Roles | Notes                          |
|--------|------------------------|------|-------|--------------------------------|
| POST   | /                      | Yes  | Any   | Initiate (needs AWAITING_PAY)  |
| POST   | /:id/process           | Yes  | Any   | Confirm/process + simulateFail |
| GET    | /:id                   | Yes  | Any   |                                |
| GET    | /booking/:bookingId    | Yes  | Any   |                                |
| PATCH  | /:id/status            | Yes  | ADMIN | Manual override                |
| POST   | /:id/refund            | Yes  | ADMIN |                                |

#### Notifications (`/notifications`)
| Method | Path          | Auth | Notes                   |
|--------|---------------|------|-------------------------|
| GET    | /             | Yes  | ?unreadOnly, pagination |
| GET    | /unread-count | Yes  |                         |
| PATCH  | /:id/read     | Yes  |                         |
| PATCH  | /read-all     | Yes  |                         |

---

### Backend Findings & Frontend Implications

1. **No refresh token** — JWT access token only. Frontend stores in localStorage + clears on 401. In production, migrate to httpOnly cookie.

2. **TransformInterceptor** — All responses wrapped in `{ data: T, statusCode, timestamp }`. API client unwraps `.data` automatically.

3. **Pagination** — All list endpoints return `{ data: T[], meta: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }`.

4. **Concurrency-safe bookings** — Backend uses pessimistic write locks. Frontend should debounce the submit button (handled via `isPending` state).

5. **Payment flow is 2-step**: POST /payments (create) → POST /payments/:id/process (confirm). Frontend `PaymentFlow` component handles both atomically.

6. **Image upload** — Multipart form data to `POST /cars/:id/images`. Files stored at `/uploads/filename` and served statically.

7. **Soft deletes** — Users, Cars, Bookings all support soft delete via TypeORM `DeleteDateColumn`. Admin can restore cars via `POST /cars/:id/restore`.

8. **Status transitions** — Validated both server-side and reflected in `ALLOWED_STATUS_TRANSITIONS` on the frontend so the UI only shows valid actions.

---

## 2. FRONTEND ARCHITECTURE

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom font vars (Syne display, DM Sans body)
- **State:** Zustand (auth + notifications) + TanStack React Query (server data)
- **Forms:** React Hook Form + Zod (schemas mirror backend DTOs exactly)
- **HTTP:** Axios with interceptors (token injection, 401 auto-redirect)
- **Toasts:** Sonner
- **Theme:** next-themes (dark mode)

---

### Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                    ← Root layout + Providers
│   ├── globals.css
│   ├── page.tsx                      ← Public home page
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (public)/
│   │   └── cars/
│   │       ├── page.tsx              ← Public car listing + filters
│   │       └── [id]/page.tsx         ← Car detail + BookingForm
│   └── (dashboard)/
│       ├── page.tsx                  ← Dashboard home (role-aware)
│       ├── bookings/
│       │   ├── page.tsx              ← My bookings
│       │   └── [id]/
│       │       ├── page.tsx          ← Booking detail + status actions
│       │       └── pay/page.tsx      ← Payment flow
│       ├── cars/
│       │   ├── page.tsx              ← Lessor: my listings
│       │   ├── new/page.tsx          ← Create listing
│       │   └── [id]/page.tsx         ← Edit listing + bookings tab
│       ├── notifications/page.tsx
│       ├── profile/page.tsx
│       └── admin/
│           ├── users/page.tsx
│           ├── cars/page.tsx
│           ├── bookings/page.tsx
│           └── payments/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Providers.tsx             ← QueryClient + ThemeProvider + Toaster
│   │   ├── Sidebar.tsx               ← Role-filtered navigation
│   │   ├── Topbar.tsx                ← Dark mode + notification bell
│   │   └── DashboardLayout.tsx       ← Sidebar + Topbar wrapper
│   ├── auth/
│   │   └── ProtectedRoute.tsx        ← Auth + role guard HOC
│   ├── ui/
│   │   └── index.tsx                 ← Badge, Skeleton, Button, Input,
│   │                                    Select, Textarea, Modal, Pagination,
│   │                                    EmptyState, ErrorState, StatCard, Spinner
│   ├── cars/
│   │   ├── CarCard.tsx
│   │   └── CarFilters.tsx
│   ├── bookings/
│   │   ├── BookingCard.tsx           ← BookingStatusBadge + card
│   │   └── BookingForm.tsx           ← Date picker + price calc
│   ├── payments/
│   │   └── PaymentFlow.tsx           ← 2-step payment + simulate failure
│   └── notifications/
│       └── NotificationItem.tsx
│
├── services/                         ← API call functions (pure)
│   ├── auth.service.ts
│   ├── cars.service.ts
│   ├── bookings.service.ts
│   ├── payments.service.ts
│   ├── notifications.service.ts
│   └── users.service.ts
│
├── hooks/                            ← React Query hooks
│   ├── index.ts                      ← Re-exports
│   ├── useCars.ts
│   ├── useBookings.ts
│   └── usePayments.ts
│
├── store/                            ← Zustand stores
│   ├── auth.store.ts                 ← Persisted (localStorage)
│   └── notifications.store.ts
│
├── types/
│   └── index.ts                      ← All TypeScript types (mirrors backend)
│
└── lib/
    ├── api-client.ts                 ← Axios instance + interceptors
    ├── utils.ts                      ← Formatters, status helpers, cn()
    └── validations.ts                ← Zod schemas (mirror backend DTOs)
```

---

### State Management Strategy

| Data            | Where            | Why                                        |
|-----------------|------------------|--------------------------------------------|
| Auth user/token | Zustand (persist)| Survives page reload, shared app-wide      |
| Notifications   | Zustand          | Real-time unread count in topbar           |
| Cars list       | React Query      | Server state, cache + invalidation         |
| Bookings list   | React Query      | Server state, cache + invalidation         |
| Payments        | React Query      | Server state                               |
| Form state      | React Hook Form  | Local form lifecycle                       |

---

### Auth Flow

1. User submits login → `POST /auth/login`
2. `{ accessToken, user }` stored in Zustand + localStorage via `tokenStorage`
3. Axios request interceptor injects `Authorization: Bearer <token>` on every request
4. On 401 response → `tokenStorage.clear()` + redirect to `/auth/login`
5. `ProtectedRoute` component wraps every dashboard page — checks `isAuthenticated` + `requiredRoles`

---

### Booking Flow (End-to-End)

```
[User] Browse /cars → Pick car → /cars/:id
    → BookingForm (date picker + price calc)
    → POST /bookings → status: PENDING

[Lessor] /dashboard/cars/:id → Bookings tab
    → PATCH /bookings/:id/status { status: awaiting_payment }

[User] Notification arrives → /dashboard/bookings/:id
    → "Pay Now" → /dashboard/bookings/:id/pay
    → PaymentFlow:
        1. POST /payments { bookingId, amount, provider }
        2. POST /payments/:id/process
        → success: booking.status = approved
        → failure: booking remains awaiting_payment (retry)

[Lessor] PATCH /bookings/:id/status { status: completed }
```

---

### Dark Mode

Implemented via `next-themes`. Toggle button in `Topbar`. All components use Tailwind `dark:` variants. Default: system preference.

---

### Quick Start

```bash
# 1. Install
cd frontend
npm install

# 2. Environment
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your NestJS backend

# 3. Run
npm run dev
# → http://localhost:3001

# Make sure backend is running on :3000
```

---

### Environment Variables

| Variable               | Default                          | Required |
|------------------------|----------------------------------|----------|
| NEXT_PUBLIC_API_URL    | http://localhost:3000/api/v1     | Yes      |
| NEXT_PUBLIC_APP_URL    | http://localhost:3001            | No       |
