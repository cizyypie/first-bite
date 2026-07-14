const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: "order-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: "./services/order-service",
      watch: true,
      env: {
        PORT: 3001,
        RABBITMQ_URL:  RABBITMQ_URL
      }
    },
    {
      name: "payment-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: "./services/payment-service",
      watch: true,
      env: {
        PORT: 3002,
        RABBITMQ_URL: RABBITMQ_URL,
        STRIPE_SECRET_KEY: STRIPE_SECRET_KEY
      }
    },
    {
      name: "notification-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: "./services/notification-service",
      watch: true,
      env: {
        RABBITMQ_URL: RABBITMQ_URL
      }
    }
  ]
};