const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, amount, ticketData } = req.body;

  // STEP A: Create Razorpay Order
  if (action === 'create-order') {
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay takes amount in Paise (e.g. ₹299 = 29900 paise)
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });
      return res.status(200).json(order);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // STEP B: Save Paid Registration to Database
  if (action === 'save-registration') {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert([{
          full_name: ticketData.fullName,
          email: ticketData.email,
          phone: ticketData.phone,
          event_name: 'AFK Diwali Party 2026',
          ticket_type: ticketData.ticketType,
          ticket_id: ticketData.ticketId,
          payment_id: ticketData.paymentId,
          payment_status: 'paid'
        }]);

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};