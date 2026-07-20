import { Elysia } from 'elysia';
import { services } from '../config/service';
import { proxyHelper } from '../utils/proxy';
import { adminGuard } from '../middleware/auth';

// Public routes — no auth required
export const publicRoutes = new Elysia()
  // User Authentication (login, register)
  .all('/api/users/*', ({ request }) => proxyHelper(services.users, request))

  // Menu & Categories — read only (customers browsing)
  .get('/api/menu/*', ({ request }) => proxyHelper(services.menu, request))
  .get('/api/menu', ({ request }) => proxyHelper(services.menu, request))
  .get('/api/categories/*', ({ request }) => proxyHelper(services.menu, request))
  .get('/api/categories', ({ request }) => proxyHelper(services.menu, request))

  // Orders — customers can create orders (guest or logged in)
  .post('/api/orders', ({ request }) => proxyHelper(services.orders, request))
  .post('/api/orders/*', ({ request }) => proxyHelper(services.orders, request))

  // Payment — create checkout session (customers need this to pay)
  .post('/api/payments/checkout', ({ request }) => proxyHelper(services.payments, request))

  // Payment — verify payment after Stripe redirect
  .get('/api/payments/verify', ({ request }) => proxyHelper(services.payments, request))

  // Stripe Webhooks (called by Stripe, must be public)
  .post('/api/webhook/stripe', ({ request }) => proxyHelper(services.payments, request), {
    parse: [] // Disable body parsing to preserve raw bytes for Stripe signature verification
  });

// Admin routes — requires valid JWT with ADMIN role
export const adminRoutes = new Elysia()
  .use(adminGuard)

  // Menu management (create, update, delete)
  .post('/api/menu/*', ({ request }) => proxyHelper(services.menu, request))
  .post('/api/menu', ({ request }) => proxyHelper(services.menu, request))
  .put('/api/menu/*', ({ request }) => proxyHelper(services.menu, request))
  .patch('/api/menu/*', ({ request }) => proxyHelper(services.menu, request))
  .delete('/api/menu/*', ({ request }) => proxyHelper(services.menu, request))

  // Category management (create, update, delete)
  .post('/api/categories/*', ({ request }) => proxyHelper(services.menu, request))
  .post('/api/categories', ({ request }) => proxyHelper(services.menu, request))
  .put('/api/categories/*', ({ request }) => proxyHelper(services.menu, request))
  .patch('/api/categories/*', ({ request }) => proxyHelper(services.menu, request))
  .delete('/api/categories/*', ({ request }) => proxyHelper(services.menu, request))

  // Order management (view all, update status)
  .get('/api/orders', ({ request }) => proxyHelper(services.orders, request))
  .get('/api/orders/*', ({ request }) => proxyHelper(services.orders, request))
  .put('/api/orders/*', ({ request }) => proxyHelper(services.orders, request))
  .patch('/api/orders/*', ({ request }) => proxyHelper(services.orders, request));
