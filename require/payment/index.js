const utils = require('../utils.js');
const config = require('./config.js');
const apiUrl = 'https://api.stripe.com/v1';
const handleResult = (result, extra) => {
  if (result.id) {
    return { result, ...extra };
  }
  else {
    throw new Error(`pay_error@code=${result?.error.code},message=${result?.error.message}`);
  }
}
module.exports = {
  createPayment: async function (order) {
    let body = '';
    body += 'mode=payment';
    body +=`&success_url=${encodeURIComponent(`https://${config.host}/checkPayment?session_id={CHECKOUT_SESSION_ID}`)}`;
    for (let i = 0; i < order.items.length; i++) {
      body += `&line_items[${i}][price_data][product_data][name]=${order.items[i].name}`;
      body += `&line_items[${i}][price_data][currency]=${order.currency}`;
      body += `&line_items[${i}][price_data][unit_amount]=${order.items[i].unit_price * 100}`; // in cents
      body += `&line_items[${i}][quantity]=${order.items[i].quantity}`;
    }
    body += `&metadata[table4OrderId]=${order.table4_id}`;
    const result = await utils.fetch(`${apiUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      },
      body
    });
    return handleResult(result, {
      url: result.url,
      failed: result.status == 'expired',
      paid: result.payment_status == 'paid',
      amount: result.amount_total / 100,
      currency: result.currency
    });
  },
  getPayment: async function (payment) {
    const result = await utils.fetch(`${apiUrl}/checkout/sessions/${payment.result.id}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      }
    });
    return handleResult(result, {
      url: result.url,
      failed: result.status == 'expired',
      paid: result.payment_status == 'paid',
      amount: result.amount_total / 100,
      currency: result.currency
    });
  },
  createRefund: async function (payment) {
    const result = await utils.fetch(`${apiUrl}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      },
      body: `payment_intent=${payment.result.payment_intent}`
    });
    return handleResult(result, {
      failed: result.status == 'failed',
      refunded: result.status == 'succeeded',
      amount: result.amount / 100,
      currency: result.currency
    });
  },
  getRefund: async function (refund) {
    const result = await utils.fetch(`${apiUrl}/refunds/${refund.result.id}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      }
    });
    return handleResult(result, {
      failed: result.status == 'failed',
      refunded: result.status == 'succeeded',
      amount: result.amount / 100,
      currency: result.currency
    });
  },
}
