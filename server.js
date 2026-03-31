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

// Verify Payment Endpoint
app.post('/verify-payment', async (req, res) => {
  const { transaction_id, tx_ref, amount, email, customer_name, items } = req.body;

  if (!transaction_id) {
    return res.status(400).json({ status: 'error', message: 'Transaction ID is required' });
  }

  try {
    // Verify transaction with Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const verificationData = response.data.data;

    // Strict validation
    if (
      verificationData.status === 'successful' &&
      verificationData.amount >= amount &&
      verificationData.currency === 'NGN' &&
      verificationData.tx_ref === tx_ref
    ) {
      // Payment is verified successfully
      console.log(`Payment verified for ${email}: ${tx_ref}`);

      // Send email to owner
      const ownerMailOptions = {
        from: `"Veeluxe Skincare" <${process.env.GMAIL_USER}>`,
        to: 'Veeluxebrand@gmail.com',
        subject: `New Order Received - ${tx_ref}`,
        text: `
New order received!

Customer Details:
Name: ${customer_name}
Email: ${email}

Order Details:
${itemsList}

Total Amount: ₦${amount.toLocaleString()}
Transaction Reference: ${tx_ref}
Flutterwave Transaction ID: ${transaction_id}

Payment Status: VERIFIED
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
