import amqp from "amqplib";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const startPaymentWorker = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);
    const channel = await connection.createChannel();
    
    await channel.assertQueue("order_created", { durable: true });
    console.log("💳 Payment Service listening for orders...");

    channel.consume("order_created", async (msg) => {
        if (msg !== null) {
            const orderData = JSON.parse(msg.content.toString());
            
            try {
                // Generate Stripe Checkout URL
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items: [{
                        price_data: {
                            currency: "usd", // Change to your currency if needed
                            product_data: { name: `Order for ${orderData.customerName}` },
                            unit_amount: orderData.totalAmount * 100, // Stripe expects amounts in cents
                        },
                        quantity: 1,
                    }],
                    mode: "payment",
                    success_url: "http://localhost:3000/success", // Placeholder frontend URLs
                    cancel_url: "http://localhost:3000/cancel",
                    metadata: { orderId: orderData.orderId } // Crucial: links payment back to the exact order
                });

                console.log(`Stripe URL for ${orderData.customerName}: ${session.url}`);
                channel.ack(msg); 
                
            } catch (error) {
                console.error("Stripe Error:", error);
            }
        }
    });
};