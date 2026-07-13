import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { startPaymentWorker, handleStripeWebhook } from './queue';

startPaymentWorker();

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Payment Service Running')
  // Route for Stripe to ping
  .post('/api/webhook/stripe', async ({ request, set }) => {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      set.status = 400;
      return { error: 'Missing signature' };
    }

    const rawBody = await request.text();
    const result = await handleStripeWebhook(rawBody, signature);
    
    if (!result.success) {
      set.status = 400;
      return { error: result.message };
    }

    return { received: true };
  })
  .listen(process.env.PORT || 3002);

console.log(`💳 Payment service running at ${app.server?.hostname}:${app.server?.port}`);