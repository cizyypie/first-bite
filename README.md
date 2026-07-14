# First Bite

A restaurant ordering system built with a microservices architecture. Customers browse a menu, order as a guest or as a logged-in user, and pay through Stripe. Admins manage the menu and track incoming orders in real time.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [Elysia](https://elysiajs.com) (TypeScript)
- **Database:** PostgreSQL ([Neon](https://neon.tech)) + [Drizzle ORM](https://orm.drizzle.team)
- **Message Queue:** RabbitMQ
- **Payments:** Stripe (Checkout + Webhooks)
- **Email:** Nodemailer
- **Process Manager:** PM2
- **Auth:** JWT (`@elysiajs/jwt`)

## Architecture

Everything goes through a single public entry point, the API Gateway. Downstream services are never called directly by the frontend.

```
Frontend
   |
   v
API Gateway (:8000)  <-- only public-facing service
   |
   |--- users-service     (:3004)  register / login
   |--- menu-service       (:3000)  categories & items
   |--- order-service      (:3001)  orders, guest & logged-in
   |--- payment-service    (:3002)  Stripe checkout + webhook

order-service --> RabbitMQ --> payment-service --> RabbitMQ --> notification-service
```

Each service owns its own database and its own concern. Services talk to each other asynchronously through RabbitMQ for anything event-driven (order placed, payment confirmed, email needed).

## Services

| Service | Responsibility | Port |
|---|---|---|
| `api-gateway` | Routes requests, enforces admin-only access | 8000 |
| `users-service` | Registration, login, issues JWTs | 3004 |
| `menu-service` | Menu categories and items (CRUD) | 3000 |
| `order-service` | Order creation, status, guest/customer logic | 3001 |
| `payment-service` | Stripe checkout sessions and webhook handling | 3002 |
| `notification-service` | Sends order/payment emails | worker only |

## Features

- Guest checkout — order without creating an account
- Account-based checkout — logged-in customers only need to provide a table number
- Admin dashboard capabilities — manage menu categories/items, view and update order status
- Stripe-powered payments with webhook confirmation
- Automatic cancellation of unpaid orders after 5 minutes
- Email notifications on order and payment events
- Role-based access control (customer vs admin) enforced at the gateway

## Project Structure

```
first-bite/
├── docker-compose.yml       # RabbitMQ container
├── ecosystem.config.js      # PM2 process definitions
├── package.json             # root scripts (install/migrate/start all services)
└── services/
    ├── api-gateway/
    ├── users-service/
    ├── menu-service/
    ├── order-service/
    ├── payment-service/
    └── notification-service/
```

Each service follows the same internal layout:

```
service-name/
├── src/
│   ├── db/            # Drizzle schema + client
│   ├── middleware/    # auth guards, error handling
│   ├── routes/        # HTTP route definitions
│   ├── services/      # business logic
│   └── index.ts        # entry point
├── drizzle.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A PostgreSQL database per service (this project uses [Neon](https://neon.tech))
- RabbitMQ (run via `docker-compose up -d`)
- A Stripe account with a secret key and webhook secret
- An SMTP provider for sending emails

### Installation

Install dependencies for every service:

```bash
npm run install-all
```

### Environment Variables

Each service has its own `.env` file. Keys that must be identical across services:

| Variable | Required by |
|---|---|
| `JWT_SECRET` | api-gateway, users-service, order-service |
| `RABBITMQ_URL` | order-service, payment-service, notification-service |

Other variables (set per service, see each `.env`):

- `DATABASE_URL` — Postgres connection string (each service has its own database)
- `PORT` — HTTP port for the service
- `MENU_SERVICE_URL`, `ORDER_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `USER_SERVICE_URL` — used by api-gateway to reach downstream services
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payment-service
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — notification-service

### Running Locally

Start RabbitMQ:

```bash
docker-compose up -d
```

Run database migrations for all services:

```bash
npm run migrate
```

Start all services:

```bash
npm run start
```

Useful PM2 commands:

```bash
npm run status    # check running services
npm run logs      # tail logs
npm run restart   # restart all services
npm run stop      # stop all services
```

## Auth Model

There's a single JWT secret shared by `api-gateway`, `users-service`, and `order-service`. `users-service` issues the token on login. `api-gateway` verifies the token and checks the user's role before allowing access to admin-only routes (managing the menu, viewing/updating orders). `order-service` uses an optional auth check — it never blocks a request, it just attaches the logged-in user if a valid token is present, otherwise treats the request as a guest order.

## Order & Payment Flow

1. Customer places an order → saved as `PENDING_PAYMENT`, event published to RabbitMQ.
2. `payment-service` picks up the event and creates a Stripe Checkout session.
3. Customer pays on Stripe's hosted page.
4. Stripe calls the webhook to confirm payment → transaction recorded, event published.
5. `notification-service` sends a confirmation email.
6. Orders still unpaid after 5 minutes are automatically cancelled by a cron job.

## License

Personal project — no license specified yet.
