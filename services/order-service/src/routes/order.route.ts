import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { optionalAuth } from "../middleware/optionalAuth";
import { OrderService } from "../services/order.service";

const orderService = new OrderService();

export const orderRoutes = new Elysia({ prefix: "/api/orders" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
  .derive(optionalAuth)
  // Admin: get all orders
  .get("/", async () => {
    return await orderService.getAllOrders();
  })

  // Admin: get single order with items
  .get("/:id", async ({ params, set }) => {
    try {
      return await orderService.getOrderById(params.id);
    } catch (error: any) {
      set.status = 404;
      return { error: "Order not found" };
    }
  })

  // Admin: update order status
  .patch("/:id/status", async ({ params, body, set }) => {
    try {
      return await orderService.updateOrderStatus(params.id, body.status);
    } catch (error: any) {
      set.status = 404;
      return { error: "Order not found" };
    }
  }, {
    body: t.Object({
      status: t.String()
    })
  })

  .post(
    "/",
    async ({ body, user, set }: any) => {
      const finalEmail = user ? user.email : body.email;
      if (!finalEmail) {
        set.status = 400;
        return { error: "Email is required" };
      }

      return await orderService.createOrder({
        ...body,
        customerName: body.customerName,
        email: finalEmail,
        userId: user ? user.userId : null,
      });
    },
    {
      body: t.Object({
        customerName: t.String(),
        email: t.Optional(t.String()),
        tableNumber: t.String(),
        items: t.Array(
          t.Object({ id: t.String(), price: t.Number(), quantity: t.Number() }),
        ),
      }),
    },
  );

