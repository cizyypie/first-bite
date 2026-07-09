import { db } from '../db/client';
import { orders, orderItems } from '../db/schema';
import { publishOrderCreated } from '../queue';
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  async createOrder(data: any) {
    const orderId = uuidv4();
    
    // Calculate total
    let total = 0;
    for (const item of data.items) total += (item.price * item.quantity);

    // Insert Order
    await db.insert(orders).values({
      id: orderId,
      email: data.email,
      tableNumber: data.tableNumber,
      totalAmount: total,
      createdAt: new Date(),
    });

    // Insert Items
    for (const item of data.items) {
      await db.insert(orderItems).values({
        id: uuidv4(),
        orderId: orderId,
        itemId: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.price
      });
    }

    // Trigger Notification/Payment
    publishOrderCreated({ orderId, email: data.email, totalAmount: total });

    return { message: "Order created", orderId, status: "PENDING" };
  }
}