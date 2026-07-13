import amqp from "amqplib";
import { sendNotification } from "./mailer";

export const startEmailWorker = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    const channel = await connection.createChannel();
    
    await channel.assertQueue("email_notifications", { durable: true });
    console.log("📨 Notification Service listening for emails...");

    channel.consume("email_notifications", async (msg) => {
        if (msg !== null) {
            const data = JSON.parse(msg.content.toString());
            try {
                await sendNotification(data);
                channel.ack(msg); // ONLY delete if email succeeds
            } catch (error) {
                console.error("Failed to send email:", error);
            }
        }
    });
};