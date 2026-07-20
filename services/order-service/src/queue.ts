import amqp from "amqplib";
import { db } from "./db/client";
import { orders } from "./db/schema";
import { eq } from "drizzle-orm";

let channel: amqp.Channel;

export const connectQueue = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue("order_created", { durable: true });
    await channel.assertQueue("payment_success", { durable: true });
    console.log("🐇 Order Service connected to RabbitMQ!");

    // Listen for payment confirmations and update order status
    channel.consume("payment_success", async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log(`💰 Payment confirmed for order ${data.orderId}`);

                await db
                    .update(orders)
                    .set({ status: data.status || "PAID" })
                    .where(eq(orders.id, data.orderId));

                channel.ack(msg);
            } catch (error) {
                console.error("Error processing payment_success:", error);
            }
        }
    });
};

export const publishOrderCreated = (orderData: any) => {
    if (channel) {
        channel.sendToQueue("order_created", Buffer.from(JSON.stringify(orderData)), { persistent: true });
    }
};
