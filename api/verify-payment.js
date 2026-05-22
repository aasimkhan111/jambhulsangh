const crypto = require('crypto');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { order_id, payment_id, signature } = req.body || {};

  // Validate missing fields
  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({
      error: 'Missing required verification fields',
      details: {
        order_id: !order_id ? 'Missing' : 'Present',
        payment_id: !payment_id ? 'Missing' : 'Present',
        signature: !signature ? 'Missing' : 'Present'
      }
    });
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return res.status(500).json({ error: 'Razorpay API secret not configured on the server' });
    }

    // Verify cryptographic signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (generated_signature === signature) {
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.warn('Payment Signature Mismatch!');
      return res.status(400).json({ success: false, error: 'Signature mismatch. Payment verification failed.' });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return res.status(500).json({
      error: 'Failed to verify payment',
      details: error.message || error
    });
  }
};
