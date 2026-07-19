const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: "api-gateway",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/api-gateway"),
      watch: true,
      env: {
        PORT: 8000,
        JWT_SECRET: process.env.JWT_SECRET,
      }
    },
    {
      name: "users-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/users-service"),
      watch: true,
      env: {
        PORT: 3004,
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.USERS_DATABASE_URL,
      }
    },
    {
      name: "menu-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/menu-service"),
      watch: true,
      env: {
        PORT: 3000,
        DATABASE_URL: process.env.MENU_DATABASE_URL,
      }
    },
    {
      name: "order-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/order-service"),
      watch: true,
      env: {
        PORT: 3001,
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.ORDERS_DATABASE_URL,
        RABBITMQ_URL: process.env.RABBITMQ_URL,
      }
    },
    {
      name: "payment-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/payment-service"),
      watch: true,
      env: {
        PORT: 3002,
        DATABASE_URL: process.env.PAYMENTS_DATABASE_URL,
        RABBITMQ_URL: process.env.RABBITMQ_URL,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      }
    },
    {
      name: "notification-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: path.join(__dirname, "services/notification-service"),
      watch: true,
      env: {
        PORT: 3003,
        RABBITMQ_URL: process.env.RABBITMQ_URL,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
      }
    }
  ]
};
