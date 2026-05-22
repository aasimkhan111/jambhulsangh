const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount } = req.body || {};

  // Check if amount is provided
  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const numericAmount = parseInt(amount);

  // Validate amount >= 100 paise
  if (isNaN(numericAmount) || numericAmount < 100) {
    return res.status(400).json({ error: 'Amount must be a valid number and at least 100 paise' });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(401).json({ error: 'Razorpay API credentials not configured on the server' });
    }

    const rzp = new Razorpay({
      key_id: key_id,
      key_secret: key_secret
    });

    const options = {
      amount: numericAmount,
      currency: 'INR',
      receipt: 'receipt_order_' + Date.now()
    };

    const order = await rzp.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      details: error.message || error
    });
  }
};
