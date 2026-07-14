import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { menuRoutes } from './routes/menu.route';
import { categoryRoutes } from './routes/category.route';

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/docs' }))
  .use(menuRoutes)
  .use(categoryRoutes)
  .listen(process.env.PORT || 3000);

console.log(`🍽️ Menu service running at ${app.server?.hostname}:${app.server?.port}`);
