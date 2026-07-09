import { Elysia, t } from 'elysia';
import { OrderService } from '../services/order.service';

const orderService = new OrderService();

export const orderRoutes = new Elysia({ prefix: '/api/orders' })
  .post('/', async ({ body }) => {
    return await orderService.createOrder(body);
  }, {
    body: t.Object({
      email: t.String(),
      tableNumber: t.String(),
      items: t.Array(t.Object({
        id: t.String(),
        price: t.Number(),
        quantity: t.Number()
      }))
    })
  });