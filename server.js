require('dotenv').config();
const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Veeluxe Backend is running...');
});

// Order Statuses Configuration
const ORDER_STATUSES = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  CUSTOMS_CLEARANCE: 'Pending Customs Clearance',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery Failed'
};

// Notification Helper
async function sendStatusNotification(email, status, orderDetails) {
  const mailOptions = {
    from: `"Veeluxe Skincare" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Order Update: ${status} - ${orderDetails.reference}`,
    text: `
Hello ${orderDetails.customer_name},

Your order status has been updated to: ${status}

Order Reference: ${orderDetails.reference}
Total Amount: ₦${orderDetails.amount.toLocaleString()}

${status === ORDER_STATUSES.DISPATCHED ? 'Tracking Number: ' + (orderDetails.tracking_number || 'TBA') : ''}
${status === ORDER_STATUSES.DELIVERY_FAILED ? 'Retry Instructions: Our courier will contact you within 24 hours for a second delivery attempt.' : ''}

Thank you for choosing Veeluxe!
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${email} for status ${status}`);
  } catch (error) {
    console.error(`Error sending notification to ${email}:`, error);
  }
}

// Verify Payment Endpoint
app.post('/verify-payment', async (req, res) => {
  const { reference, amount, email, customer_name, items } = req.body;

  if (!reference) {
    return res.status(400).json({ status: 'error', message: 'Transaction reference is required' });
  }

  try {
    // Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verificationData = response.data.data;

    // Construct items list for email
    const itemsList = items && items.length > 0 
      ? items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ₦${(item.price * item.quantity).toLocaleString()}`).join('\n')
      : 'No items details provided';

    // Strict validation
    if (
      verificationData.status === 'success' &&
      verificationData.amount >= amount * 100 &&
      verificationData.customer.email === email
    ) {
      // Payment is verified successfully
      console.log(`Payment verified for ${email}: ${reference}`);

      // Send initial notification
      await sendStatusNotification(email, ORDER_STATUSES.PAYMENT_CONFIRMED, {
        reference,
        amount,
        customer_name
      });

      // Send email to owner
      const ownerMailOptions = {
        from: `"Veeluxe Skincare" <${process.env.GMAIL_USER}>`,
        to: 'Veeluxebrand@gmail.com',
        subject: `New Order Received - ${reference}`,
        text: `
New order received!

Customer Details:
Name: ${customer_name}
Email: ${email}

Order Details:
${itemsList}

Total Amount: ₦${amount.toLocaleString()}
Transaction Reference: ${reference}
Paystack Transaction ID: ${verificationData.id}

Payment Status: VERIFIED
Initial Order Status: ${ORDER_STATUSES.PAYMENT_CONFIRMED}
        `,
      };

      transporter.sendMail(ownerMailOptions, (error, info) => {
        if (error) console.error('Error sending order email to owner:', error);
      });

      return res.status(200).json({
        status: 'success',
        message: 'Payment verified and order confirmed',
        data: verificationData,
      });
    } else {
      // Payment verification failed
      console.error('Payment verification failed:', verificationData);
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed or details mismatch',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error.response ? error.response.data : error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during verification',
    });
  }
});

// Contact Form Endpoint
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  const mailOptions = {
    from: `"Veeluxe Contact Form" <${process.env.GMAIL_USER}>`,
    to: 'Veeluxebrand@gmail.com',
    replyTo: email,
    subject: `New Message from ${name}`,
    text: `
You have a new message from your website contact form.

Name: ${name}
Email: ${email}

Message:
${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ status: 'success', message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
