import amqp from "amqplib";

let amqpChannel: amqp.Channel;

export const startQueue = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    amqpChannel = await connection.createChannel();

    await amqpChannel.assertQueue("order_created", { durable: true });
    await amqpChannel.assertQueue("payment_success", { durable: true });
    await amqpChannel.assertQueue("email_notifications", { durable: true });

    console.log("Payment Service connected to RabbitMQ (order_created consumer disabled)");
};

export const publishToQueue = async (queueName: string, data: any) => {
    if (!amqpChannel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    amqpChannel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );
};
