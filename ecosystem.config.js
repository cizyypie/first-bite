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
        RABBITMQ_URL: "amqp://admin:password123@localhost:5672"
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
        RABBITMQ_URL: "amqp://admin:password123@localhost:5672",
        STRIPE_SECRET_KEY: "sk_test_your_key_here"
      }
    },
    {
      name: "notification-service",
      script: "bun",
      args: "run src/index.ts",
      cwd: "./services/notification-service",
      watch: true,
      env: {
        RABBITMQ_URL: "amqp://admin:password123@localhost:5672"
      }
    }
  ]
};