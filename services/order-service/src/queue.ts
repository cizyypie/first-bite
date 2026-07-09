import amqp from "amqplib";

let channel: amqp.Channel;

export const connectQueue = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://admin:password123@localhost:5672");
    channel = await connection.createChannel();
    await channel.assertQueue("order_created_queue", { durable: true });
    console.log("🐇 Order Service connected to RabbitMQ!");
};

export const publishOrderCreated = (orderData: any) => {
    if (channel) {
        channel.sendToQueue("order_created_queue", Buffer.from(JSON.stringify(orderData)), { persistent: true });
    }
};