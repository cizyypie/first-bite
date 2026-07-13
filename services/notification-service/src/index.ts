import { Elysia } from 'elysia';
import { startEmailWorker } from './queue';

startEmailWorker();

const app = new Elysia()
  .get('/', () => 'Notification Service Running')
  .listen(process.env.PORT || 3003);

console.log(`🦊 Notification service running at ${app.server?.hostname}:${app.server?.port}`);