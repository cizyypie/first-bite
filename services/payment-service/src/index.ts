import { Elysia } from 'elysia';
import { webhookRoutes } from './routes/webhook';
import { checkoutRoutes } from './routes/checkout';
import { startQueue } from './queue';

startQueue();

const app = new Elysia()
  .use(webhookRoutes)
  .use(checkoutRoutes)
  .listen(process.env.PORT || 3002);

console.log(`🦊 Payment service running at ${app.server?.hostname}:${app.server?.port}`);
