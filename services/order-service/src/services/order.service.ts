import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { orders, orderItems } from "../db/schema";
import { publishOrderCreated } from "../queue";

export class OrderService {
  // Get all orders (admin dashboard)
  async getAllOrders() {
    return await db.select().from(orders).orderBy(orders.createdAt);
  }

  // Get single order by ID (with its items)
  async getOrderById(id: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) throw new Error('ORDER_NOT_FOUND');

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  // Update order status
  async updateOrderStatus(id: string, status: string) {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    if (!updated) throw new Error('ORDER_NOT_FOUND');
    return updated;
  }

  async createOrder(data: any) {
    const total = data.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );

    // 1. Insert Order with Name
    const insertedOrders = await db
      .insert(orders)
      .values({
        userId: data.userId,
        customerName: data.customerName,
        email: data.email,
        tableNumber: data.tableNumber,
        totalAmount: total,
      })
      .returning();

    const newOrder = insertedOrders[0];
    if (!newOrder) {
      throw new Error("Failed to create order");
    }

    // 2. Insert Items
    const itemsToInsert = data.items.map((item: any) => ({
      orderId: newOrder.id,
      itemId: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }));
    await db.insert(orderItems).values(itemsToInsert);

    // 3. Publish Event with Name included
    publishOrderCreated({
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      email: newOrder.email,
      totalAmount: total,
    });

    return newOrder;
  }
}
