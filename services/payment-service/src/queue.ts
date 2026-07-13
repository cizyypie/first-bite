import amqp from "amqplib";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
let amqpChannel: amqp.Channel;

export const startPaymentWorker = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    amqpChannel = await connection.createChannel();
    
    await amqpChannel.assertQueue("order_created", { durable: true });
    await amqpChannel.assertQueue("payment_success", { durable: true }); // New queue
    console.log(" listening for orders...");

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
                            unit_amount: orderData.totalAmount * 100,
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

                console.log(`Stripe URL for ${orderData.customerName}: ${session.url}`);
                amqpChannel.ack(msg);
            } catch (error) {
                console.error("Stripe Session Creation Error:", error);
            }
        }
    });
};

// Process incoming Stripe events securely
export const handleStripeWebhook = async (rawBody: string, signature: string) => {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return { success: false, message: err.message };
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const paymentDetails = {
            orderId: session.metadata?.orderId,
            customerName: session.metadata?.customerName,
            email: session.metadata?.email,
            amountPaid: session.amount_total ? session.amount_total / 100 : 0,
            stripePaymentIntent: session.payment_intent as string
        };

        console.log(`📢 Payment success verified for Order: ${paymentDetails.orderId}`);

        // Broadcast success message to RabbitMQ
        amqpChannel.sendToQueue(
            "payment_success",
            Buffer.from(JSON.stringify(paymentDetails)),
            { persistent: true }
        );
    }

    return { success: true };
};