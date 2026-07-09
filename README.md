### Database Schema 

<img width="1252" height="770" alt="image" src="https://github.com/user-attachments/assets/dc668f35-fc97-48ca-ac67-6a4a1676235d" />

**1. Menu Service Database**

* **`categories`**
* `id` (uuid) - Primary Key
* `name` (varchar) - e.g., "Mains", "Drinks"
* `description` (varchar)
* `created_at` (timestamp)


* **`items`**
* `id` (uuid) - Primary Key
* `category_id` (uuid) - Foreign Key to `categories.id`
* `name` (varchar) - e.g., "Cheeseburger"
* `description` (varchar)
* `price` (int) - Stored in cents/rupiah
* `is_available` (boolean)
* `created_at` (timestamp)



**2. Order Service Database (The Orchestrator)**

* **`orders`**
* `id` (uuid) - Primary Key
* `email` (varchar) - Guest identifier
* `table_number` (varchar)
* `total_amount` (int)
* `status` (varchar) - PENDING, PREPARING, READY, COMPLETED, REFUNDED
* `created_at` (timestamp)


* **`order_items`**
* `id` (uuid) - Primary Key
* `order_id` (uuid) - Foreign Key to `orders.id`
* `item_id` (uuid) - **Soft Link:** References the Menu Service's `items.id`
* `quantity` (int)
* `price_at_purchase` (int) - Crucial for financial history if menu prices change later.



**3. Payment Service Database (Stripe)**

* **`payments`**
* `id` (uuid) - Primary Key
* `order_id` (uuid) - **Soft Link:** References Order Service's `orders.id`
* `stripe_payment_intent` (varchar)
* `amount` (int)
* `status` (varchar) - PENDING, SUCCESS, FAILED, REFUNDED
* `created_at` (timestamp)



**4. Notification Service Database**

* **`notification_logs`**
* `id` (uuid) - Primary Key
* `order_id` (uuid) - **Soft Link:** References Order Service's `orders.id`
* `recipient_email` (varchar)
* `email_type` (varchar) - RECEIPT, FOOD_READY, REFUND
* `status` (varchar) - SENT, FAILED
* `sent_at` (timestamp)

## API END POINTS
###  1. Menu Service (Port 3000)

**Categories API**

* `GET /api/categories`
* **Response:** `[{ id, name, description }]`


* `POST /api/categories` *(Admin)*
* **Body:** `{ name, description }`
**Items API**

* `GET /api/items` (Supports query: `?category_id=uuid`)
* **Response:** `[{ id, category_id, name, price, is_available }]`


* `GET /api/items/:id`
* **Response:** Single item details.


* `POST /api/items` *(Admin)*
* **Body:** `{ category_id, name, description, price, is_available }`


* `PUT /api/items/:id` *(Admin)*
* **Body:** `{ price, is_available }`
---

### 2. Order Service (Port 3001)
**HTTP APIs (Frontend)**

* `POST /api/orders` *(Customer Checkout)*
* **Body:** `{ email, table_number, items: [{ id, quantity }] }`
* **Action:** Calculates total, saves as `PENDING_PAYMENT`.
* **Publishes Event:**  `order.created` (Payload: orderId, amount, email)


* `GET /api/orders/:id` *(Customer Polling)*
* **Response:** `{ id, status, total_amount, items: [...] }`


* `PUT /api/orders/:id/status` *(Kitchen Tablet)*
* **Body:** `{ status: "PREPARING" | "READY" }`
* **Publishes Event:**  `order.status_updated` (If status is "READY")

* `POST /api/orders/:id/refund` *(Admin Dashboard)*
* **Action:** Updates status to `REFUND_REQUESTED`.
* **Publishes Event:**  `refund.requested` (Payload: orderId)

**RabbitMQ Listeners (Internal)**

* 🎧 Consumes `payment.success` ➔ Updates order status from `PENDING_PAYMENT` to `PREPARING`.
* 🎧 Consumes `payment.failed` ➔ Updates order status to `CANCELED`.

---

### 3. Payment Service (Port 3002)

**HTTP APIs (External)**

* `POST /api/webhook/stripe`
* **Action:** Stripe pings this URL securely to say a credit card charge succeeded.
* **Publishes Event:**  `payment.success` (Payload: orderId)

**RabbitMQ Listeners (Internal)**

###  4. Notification Service (Port 3003)

**HTTP APIs**

* `GET /health` ➔ Returns `200 OK` (Just so PM2/Docker knows the worker hasn't crashed).

**RabbitMQ Listeners (Internal)**

* 🎧 Consumes `payment.success` ➔ Sends **"Receipt & Order Confirmed"** email to the customer.
* 🎧 Consumes `order.status_updated` (when "READY") ➔ Sends **"Your food is arriving at your table!"** email.
* 🎧 Consumes `refund.success` ➔ Sends **"Your money has been refunded"** email.

### Project Setup
    firstbite/
    ├── .env
    ├── docker-compose.yml
    ├── ecosystem.config.js
    ├── package.json
    └── services/
    ├── menu-service/
    │   ├── src/
    │   │   ├── db/
    │   │   │   ├── client.ts
    │   │   │   └── schema.ts
    │   │   ├── middleware/
    │   │   │   ├── auth.middleware.ts
    │   │   │   └── error.middleware.ts
    │   │   ├── routes/
    │   │   │   └── menu.route.ts
    │   │   ├── services/
    │   │   │   └── menu.service.ts
    │   │   └── index.ts
    │   ├── drizzle.config.ts
    │   └── package.json
    ├── order-service/
    │   ├── src/
    │   │   ├── db/
    │   │   │   ├── client.ts
    │   │   │   └── schema.ts
    │   │   ├── middleware/
    │   │   │   ├── auth.middleware.ts
    │   │   │   └── error.middleware.ts
    │   │   ├── routes/
    │   │   │   └── order.route.ts
    │   │   ├── services/
    │   │   │   └── order.service.ts
    │   │   ├── index.ts
    │   │   └── queue.ts
    │   ├── drizzle.config.ts
    │   └── package.json
    ├── payment-service/
    │   ├── src/
    │   │   ├── db/
    │   │   │   ├── client.ts
    │   │   │   └── schema.ts
    │   │   ├── middleware/
    │   │   │   └── error.middleware.ts
    │   │   ├── routes/
    │   │   │   └── webhook.route.ts
    │   │   ├── index.ts
    │   │   └── queue.ts
    │   ├── drizzle.config.ts
    │   └── package.json
    └── notification-service/
        ├── src/
        │   ├── db/
        │   │   ├── client.ts
        │   │   └── schema.ts
        │   ├── index.ts
        │   └── queue.ts
        ├── drizzle.config.ts
        └── package.json
