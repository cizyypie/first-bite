import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendNotification = async (data: any) => {
    let subject = '';
    let html = '';
    
    if (data.status === 'PAID') {
        subject = '🧾 Your Payment Receipt';
        html = `<h2>Thank you, ${data.customerName}!</h2><p>Your payment for order <b>${data.orderId}</b> was successful.</p>`;
    } else if (data.status === 'PREPARING') {
        subject = '🍳 We are cooking your food!';
        html = `<h2>Hold tight, ${data.customerName}!</h2><p>The kitchen has started preparing order <b>${data.orderId}</b>.</p>`;
    } else if (data.status === 'READY') {
        subject = '🛍️ Order Ready for Pickup!';
        html = `<h2>Come get it, ${data.customerName}!</h2><p>Your order <b>${data.orderId}</b> is fresh and ready.</p>`;
    } else {
        throw new Error('Unknown order status');
    }

    const info = await transporter.sendMail({
        from: '"My Restaurant" <noreply@myrestaurant.com>',
        to: data.email,
        subject,
        html
    });

    console.log(`✉️ Email sent to ${data.email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
};