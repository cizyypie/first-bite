import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { publicRoutes, adminRoutes } from './routes/proxies';

const app = new Elysia()
  .use(cors())
  .use(publicRoutes)
  .use(adminRoutes)
  .listen(process.env.PORT || 8000);

console.log(`🌉 API Gateway running at http://localhost:${app.server?.port}`);
