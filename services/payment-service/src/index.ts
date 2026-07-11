import { Elysia } from 'elysia';
import { startPaymentWorker } from './queue';

startPaymentWorker();

const app = new Elysia()
  .get('/', () => 'Payment Service Running')
  .listen(process.env.PORT || 3002);

console.log(`🦊 Payment service running at ${app.server?.hostname}:${app.server?.port}`);