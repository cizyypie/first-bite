import { Elysia } from 'elysia';
import { webhookRoutes } from './routes/webhook';
import { startQueue } from './queue';

startQueue();

const app = new Elysia()
  .use(webhookRoutes)
  .listen(process.env.PORT || 3002);

console.log(`🦊 Payment service running at ${app.server?.hostname}:${app.server?.port}`);