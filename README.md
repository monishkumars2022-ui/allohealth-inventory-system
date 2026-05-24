# Inventory Reservation System

A concurrency-safe inventory reservation platform built using Next.js, Prisma, PostgreSQL, and Supabase.

This project simulates a real-world e-commerce inventory reservation workflow where stock is temporarily held during checkout to prevent overselling under concurrent traffic.

---

# Live Demo

Deployed URL:

```bash
https://allohealth-inventory-system-monish.vercel.app/
```

---

# Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Tailwind CSS
- shadcn/ui
- Vercel Deployment

---

# Features

## Inventory Management

- Multi-product inventory
- Multi-warehouse stock tracking
- Available stock calculation

```text
availableStock = totalStock - reservedStock
```

---

## Reservation Workflow

Reservations support three states:

| Status | Meaning |
|---|---|
| PENDING | Stock temporarily reserved |
| CONFIRMED | Payment succeeded |
| RELEASED | Cancelled or expired |

---

## Concurrency-Safe Reservation System

The reservation API is designed to prevent overselling under concurrent requests.

### Strategy Used

- PostgreSQL transactions
- Row-level locking using:

```sql
SELECT ... FOR UPDATE
```

### Why

When two users try reserving the last item simultaneously:

- only one transaction acquires the inventory lock first
- the second transaction waits
- after the first reservation commits, the second request sees updated stock
- if stock is unavailable, it returns:

```http
409 Conflict
```

This guarantees inventory consistency and prevents race conditions.

---

# Reservation Expiry

Reservations automatically expire after 10 minutes.

### Current Strategy

Lazy cleanup approach:

- expiry is validated during confirm flow
- expired reservations automatically release reserved stock
- reservation status changes to RELEASED

This avoids requiring a background worker while still maintaining correctness.

---

# API Endpoints

## Products

### GET `/api/products`

Returns products with warehouse inventory.

---

## Warehouses

### GET `/api/warehouses`

Returns warehouse list.

---

## Create Reservation

### POST `/api/reservations`

Creates temporary stock reservation.

Returns:

- `201 Created`
- `409 Conflict` if stock unavailable

---

## Confirm Reservation

### POST `/api/reservations/:id/confirm`

Confirms reservation and permanently deducts stock.

Returns:

- `200 OK`
- `410 Gone` if reservation expired

---

## Release Reservation

### POST `/api/reservations/:id/release`

Releases reserved stock.

---

# Frontend Features

- Product listing page
- Warehouse inventory display
- Reserve button
- Reservation checkout page
- Live countdown timer
- Confirm purchase
- Cancel reservation
- Automatic UI refresh
- Error handling for:
  - 409 conflicts
  - 410 expired reservations

---

# Database Schema

Core models:

- Product
- Warehouse
- Inventory
- Reservation

Inventory is tracked per warehouse.

---

# Running Locally

## 1. Clone Repository

```bash
git clone https://github.com/monishkumars2022-ui/allohealth-inventory-system
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create `.env`

```env
DATABASE_URL="postgresql://postgres.rkvvvpdhofxhhboetuaj:Allo@2403200@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

---

## 4. Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Push Database Schema

```bash
npx prisma db push
```

---

## 6. Seed Database

```bash
npx prisma db seed
```

---

## 7. Run Development Server

```bash
npm run dev
```

---

# Tradeoffs / Future Improvements

If given more time, I would add:

- Redis-based distributed locking
- Idempotency-Key support
- Background cron-based reservation cleanup
- WebSocket real-time inventory updates
- Authentication
- Admin inventory dashboard
- Automated tests

---

# Production Notes

Supabase transaction pooling was used in production deployment.

Prisma PgBouncer compatibility required:

```text
?pgbouncer=true&connection_limit=1
```

in the database connection string.

---

# Author

S.MonishKumar