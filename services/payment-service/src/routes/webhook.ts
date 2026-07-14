import { Elysia } from 'elysia';
import Stripe from 'stripe';
import { db } from '../db/client';
import { transactions } from '../db/schema';
import { randomUUID } from 'crypto';
import { publishToQueue } from '../queue'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const webhookRoutes = new Elysia().post(
  '/api/webhook/stripe',
  async ({ request, set }) => {
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    } catch (err: any) {
      set.status = 400;
      return `Webhook Error: ${err.message}`;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId; 
      const providerId = session.payment_intent as string; 
      const amount = (session.amount_total! / 100).toString(); 

      if (!orderId) { set.status = 400; return; }

      try {
        await db.insert(transactions).values({
          id: randomUUID(), orderId, provider: 'STRIPE', providerId, amount, status: 'SUCCESS',
        });
        
        // Notify the Order and Notification services
        await publishToQueue('payment_success', { orderId, status: 'PAID' });
      } catch (error) {
        set.status = 500; 
        return;
      }
    }
    set.status = 200;
    return { received: true };
  }
);