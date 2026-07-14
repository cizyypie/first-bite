import amqp from "amqplib";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
let amqpChannel: amqp.Channel;

// 1. Initialize connection and listeners
export const startQueue = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    amqpChannel = await connection.createChannel();
    
    await amqpChannel.assertQueue("order_created", { durable: true });
    await amqpChannel.assertQueue("payment_success", { durable: true });
    await amqpChannel.assertQueue("email_notifications", { durable: true }); 

    console.log("Payment Service connected to RabbitMQ & listening for orders...");

    amqpChannel.consume("order_created", async (msg) => {
        if (msg !== null) {
            const orderData = JSON.parse(msg.content.toString());
            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items: [{
                        price_data: {
                            currency: "usd",
                            product_data: { name: `Order for ${orderData.customerName}` },
                            unit_amount: Math.round(orderData.totalAmount * 100), // Stripe requires integers
                        },
                        quantity: 1,
                    }],
                    mode: "payment",
                    success_url: "http://localhost:3000/success",
                    cancel_url: "http://localhost:3000/cancel",
                    metadata: { 
                        orderId: orderData.orderId,
                        customerName: orderData.customerName,
                        email: orderData.email
                    }
                });

                console.log(`Stripe Checkout URL for ${orderData.customerName}: ${session.url}`);
                amqpChannel.ack(msg);
            } catch (error) {
                console.error("Stripe Session Creation Error:", error);
            }
        }
    });
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