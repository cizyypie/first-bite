import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { cron } from "@elysiajs/cron";
import { eq, and, lt } from "drizzle-orm";
import { db } from "./db/client";
import { orders } from "./db/schema";
import { errorHandler } from "./middleware/errorHandler";
import { orderRoutes } from "./routes/order.route";
import { connectQueue } from "./queue";

connectQueue();

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .use(swagger({ path: "/docs" }))
  .use(orderRoutes)
  .use(
    cron({
      name: "cancel-ghost-orders",
      pattern: "*/1 * * * *",
      async run() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        try {
          const canceledOrders = await db
            .update(orders)
            .set({ status: "CANCELLED" })
            .where(
              and(
                eq(orders.status, "PENDING_PAYMENT"),
                lt(orders.createdAt, fiveMinutesAgo),
              ),
            )
            .returning({ id: orders.id });

          if (canceledOrders.length > 0) {
            console.log(
              `🗑️ Auto-canceled ${canceledOrders.length} ghost orders.`,
            );
          }
        } catch (error) {
          console.error("Error running ghost order cleaner:", error);
        }
      },
    }),
  )
  .listen(process.env.PORT || 3001);

console.log(
  `🦊 Order service running at ${app.server?.hostname}:${app.server?.port}`,
);
