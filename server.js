require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// Load Vercel Serverless Function handlers
const configHandler = require('./api/config');
const createOrderHandler = require('./api/create-order');
const verifyPaymentHandler = require('./api/verify-payment');

// Map API routes
app.get('/api/config', configHandler);
app.post('/api/create-order', createOrderHandler);
app.post('/api/verify-payment', verifyPaymentHandler);

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname)));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Jambhulsangh Developer Server Running Locally!`);
  console.log(` URL: http://127.0.0.1:${PORT}`);
  console.log(` Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID}`);
  console.log(`==================================================`);
});
