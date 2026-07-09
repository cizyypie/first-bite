import { Elysia } from 'elysia';
import { orderRoutes } from './routes/order.route';
import { connectQueue } from './queue';

// Init RabbitMQ
connectQueue();

const app = new Elysia()
  .use(orderRoutes)
  .listen(process.env.PORT || 3001);

console.log(`🦊 Order Service running at ${app.server?.hostname}:${app.server?.port}`);