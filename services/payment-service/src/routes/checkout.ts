import { Elysia, t } from 'elysia';
import Stripe from 'stripe';
import { db } from '../db/client';
import { transactions } from '../db/schema';
import { randomUUID } from 'crypto';
import { publishToQueue } from '../queue';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const checkoutRoutes = new Elysia()
  .post('/api/payments/checkout', async ({ body, set }) => {
    try {
      const amountInCents = Math.max(Math.round(body.amount / 160), 50);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Order for ${body.customerName}` },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart.html`,
        metadata: {
          orderId: body.orderId,
          customerName: body.customerName,
          email: body.email,
          originalAmountIDR: body.amount.toString(),
        },
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('Stripe checkout error:', error.message);
      set.status = 500;
      return { error: 'Failed to create checkout session' };
    }
  }, {
    body: t.Object({
      orderId: t.String(),
      amount: t.Number(),
      customerName: t.String(),
      email: t.String(),
    })
  })

  // Verify payment after redirect from Stripe
  .get('/api/payments/verify', async ({ query, set }) => {
    const sessionId = query.session_id;
    if (!sessionId) {
      set.status = 400;
      return { error: 'session_id is required' };
    }

    try {
      console.log(`[Verify] Checking session: ${sessionId}`);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(`[Verify] Payment status: ${session.payment_status}`);

      if (session.payment_status !== 'paid') {
        return { verified: false, status: session.payment_status };
      }

      const orderId = session.metadata?.orderId;
      if (!orderId) {
        set.status = 400;
        return { error: 'No orderId in session metadata' };
      }

      console.log(`[Verify] orderId: ${orderId}`);

      // Check if we already recorded this transaction (idempotent)
      const existing = await db.select().from(transactions).where(eq(transactions.providerId, session.payment_intent as string));
      
      if (existing.length === 0) {
        // Record the transaction
        await db.insert(transactions).values({
          id: randomUUID(),
          orderId,
          provider: 'STRIPE',
          providerId: (session.payment_intent as string) || 'unknown',
          amount: (session.amount_total! / 100).toString(),
          status: 'SUCCESS',
        });
        console.log(`[Verify] Transaction recorded for order ${orderId}`);
      } else {
        console.log(`[Verify] Transaction already exists for order ${orderId}`);
      }

      // Update order status directly via order-service HTTP call
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
      const updateRes = await fetch(`${orderServiceUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });
      
      if (updateRes.ok) {
        console.log(`[Verify] Order ${orderId} status updated to PAID`);
      } else {
        console.error(`[Verify] Failed to update order status: ${updateRes.status}`);
      }

      // Also try to publish to RabbitMQ (non-blocking, for notification-service)
      try {
        await publishToQueue('payment_success', { orderId, status: 'PAID' });
      } catch (queueErr) {
        console.warn(`[Verify] RabbitMQ publish failed (non-critical):`, queueErr);
      }

      return { verified: true, orderId };
    } catch (error: any) {
      console.error('[Verify] Error:', error.message);
      set.status = 500;
      return { error: 'Failed to verify payment' };
    }
  }, {
    query: t.Object({
      session_id: t.String(),
    })
  });
