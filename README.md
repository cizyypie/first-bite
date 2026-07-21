# firstbite

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

# firstbite — System Architecture

```
                                +----------------------+
                                |      Frontend        |
                                | (static, port 5173)  |
                                +----------+-----------+
                                           |
                                           | HTTP (REST)
                                           v
                                +----------------------+
                                |     API Gateway      |
                                |   (Elysia, :8000)    |
                                |  routing + JWT auth  |
                                +----------+-----------+
                                           |
        +------------------+--------------+--------------+------------------+
        |                  |                             |                  |
        v                  v                             v                  v
+---------------+  +----------------+           +------------------+  +------------------+
| Users Service |  |  Menu Service  |           |  Order Service   |  | Payment Service  |
|  (Elysia,     |  |  (Elysia,      |           |  (Elysia,        |  |  (Elysia,        |
|   :3004)      |  |   :3000)       |           |   :3001)         |  |   :3002)         |
+-------+-------+  +--------+-------+           +---------+--------+  +---------+--------+
        |                   |                             |                     |
        v                   v                             v                     v
+---------------+  +----------------+           +------------------+  +------------------+
| users_db      |  | menu_db        |           | orders_db        |  | payments_db      |
| (Neon PG)     |  | (Neon PG)      |           | (Neon PG)        |  | (Neon PG)        |
+---------------+  +----------------+           +--------+---------+  +--------+---------+
                                                          |                     |
                                                          | order_created       | payment_success
                                                          v                     v
                                                 +-----------------------------------+
                                                 |            RabbitMQ               |
                                                 |     (Message Broker, :5672)       |
                                                 |  queues: order_created,           |
                                                 |  payment_success,                 |
                                                 |  email_notifications              |
                                                 +------------------+-----------------+
                                                                    |
                                                    +---------------+----------------+
                                                    |                                |
                                            payment_success                 email_notifications
                                                    |                                |
                                                    v                                v
                                        (consumed by Order Service           +------------------+
                                         to mark order as PAID)              | Notification     |
                                                                             | Service (:3003)  |
                                                                             +--------+---------+
                                                                                      |
                                                                                      v
                                                                             +------------------+
                                                                             |  SMTP / Email     |
                                                                             |  (External)       |
                                                                             +------------------+

        Payment Service also talks to an external payment provider:

                                                 +------------------+
                       Payment Service --------> |  Stripe API      |
                       (checkout + webhook)      |  (External)      |
                                                 +------------------+
```

## Notes

- **API Gateway** (`services/api-gateway`, port `8000`) is the single entry point for the frontend. It proxies requests to downstream services and enforces JWT auth for admin routes (`adminGuard`), while user auth/menu-read/order-create/checkout routes are public.
- **Users Service** (`:3004`) — authentication and user management, own `users_db`.
- **Menu Service** (`:3000`) — menu items and categories, own `menu_db`.
- **Order Service** (`:3001`) — order creation and status, own `orders_db`. Publishes `order_created` and consumes `payment_success` to update order status.
- **Payment Service** (`:3002`) — checkout sessions and Stripe webhooks, own `payments_db`. Publishes `payment_success` (for Order Service) and `email_notifications` (for Notification Service).
- **Notification Service** (`:3003`) — consumes `email_notifications` from RabbitMQ and sends emails via SMTP. No database of its own.
- **RabbitMQ** — async message broker decoupling Order, Payment, and Notification services (`docker-compose.yml`, port `5672`, management UI on `15672`).
- **Databases** — each service owns its own Postgres database (Neon), following the database-per-service pattern. There is no shared schema/database.
- **External integrations** — Stripe (payments) and SMTP provider (email), both called only from their owning services (Payment Service and Notification Service respectively).

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
bun run migrate
```

Start all services:

```bash
bun run start
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
