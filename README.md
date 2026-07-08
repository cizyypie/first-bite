
### 🗄️ Database Schemas 
<img width="783" height="519" alt="image" src="https://github.com/user-attachments/assets/b7435905-b75b-409c-9649-46dad3be641c" />


**1. Menu Service Database (SQLite/PostgreSQL)**

* **`items`**
* `id` (uuid) - Primary Key
* `name` (varchar) - e.g., "Cheeseburger"
* `description` (varchar)
* `price` (int) - Stored in cents/rupiah
* `is_available` (boolean)
* `created_at` (timestamp)
* `updated_at` (timestamp)



**2. Order Service Database (SQLite)**

* **`orders`**
* `id` (uuid) - Primary Key
* `email` (varchar) - Guest identifier
* `table_number` (varchar)
* `total_amount` (int)
* `status` (varchar) - PENDING, PREPARING, READY, COMPLETED, REFUNDED
* `created_at` (timestamp)
* `updated_at` (timestamp)


* **`order_items`**
* `id` (uuid) - Primary Key
* `order_id` (uuid) - Foreign Key to orders
* `item_id` (uuid) - References Menu Service item
* `quantity` (int)
* `price_at_purchase` (int) - Locks in the price



**3. Payment Service Database (SQLite)**

* **`payments`**
* `id` (uuid) - Primary Key
* `order_id` (uuid) - References Order Service ID
* `stripe_payment_intent` (varchar)
* `amount` (int)
* `status` (varchar) - PENDING, SUCCESS, FAILED, REFUNDED
* `created_at` (timestamp)



**4. Notification Service Database (SQLite - Optional Log)**

* **`notification_logs`**
* `id` (uuid) - Primary Key
* `order_id` (uuid)
* `recipient_email` (varchar)
* `email_type` (varchar) - RECEIPT, FOOD_READY, REFUND
* `sent_at` (timestamp)



---

### 🔌 API Services (Elysia Endpoints)

**Menu Service**

* `GET /items` - Get all available food items (for customer menu)
* `GET /items/:id` - Get specific item details
* `POST /items` - Admin: Create new food item
* `PUT /items/:id` - Admin: Update price or availability
* `DELETE /items/:id` - Admin: Delete item

**Order Service (The Orchestrator)**

* `POST /orders` - Customer: Submit new order (Publishes `order.created` to RabbitMQ)
* `GET /orders/:id` - Customer: Check order status
* `GET /orders/table/:tableNumber` - Check all active orders for a specific table
* `PUT /orders/:id/status` - Kitchen: Update status to PREPARING or READY
* `POST /orders/:id/refund` - Admin: Trigger a refund (Publishes `refund.requested` to RabbitMQ)

**Payment Service (Stripe Worker)**

* `POST /webhook/stripe` - Stripe pings this to confirm payment success/failure
* *(RabbitMQ)* Listens for `order.created` ➔ Creates Stripe Session
* *(RabbitMQ)* Listens for `refund.requested` ➔ Processes Stripe Refund

**Notification Service (Email Worker)**

* `GET /health` - Simple check to ensure worker is alive
* *(RabbitMQ)* Listens for `payment.success` ➔ Sends Receipt Email
* *(RabbitMQ)* Listens for `order.ready` ➔ Sends "Food is Ready!" Email
* *(RabbitMQ)* Listens for `refund.success` ➔ Sends Refund Confirmation Email

---

### 🏗️ Monorepo Project Setup

```text
resto-ordering-app/
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml       (Runs RabbitMQ)
├── ecosystem.config.js      (PM2 for all Bun services)
├── package.json
├── README.md
│
└── services/
    ├── menu-service/
    ├── order-service/
    ├── payment-service/
    └── notification-service/

