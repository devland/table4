const utils = require('../utils.js');
const config = require('./config.js');
const apiUrl = 'https://api.stripe.com/v1';
const handleResult = (result, extra) => {
  if (result.id) {
    return { done: true, result, ...extra };
  }
  else {
    return { done: false, result };
  }
}
module.exports = {
  createCheckout: async function (order) {
    let body = '';
    body += 'mode=payment';
    body +=`&success_url=${encodeURIComponent(`https://${config.host}/checkPayment?session_id={CHECKOUT_SESSION_ID}`)}`;
    for (let i = 0; i < order.items.length; i++) {
      body += `&line_items[${i}][price_data][product_data][name]=${order.items[i].name}`;
      body += `&line_items[${i}][price_data][currency]=${order.currency}`;
      body += `&line_items[${i}][price_data][unit_amount]=${order.items[i].unit_price * 100}`; // in cents
      body += `&line_items[${i}][quantity]=${order.items[i].quantity}`;
    }
    body += `&metadata[table4OrderId]=${order.id}`;
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
      paid: result.payment_status == 'paid'
    });
  },
  getCheckout: async function (checkoutId) {
    const result = await utils.fetch(`${apiUrl}/checkout/sessions/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      }
    });
    return handleResult(result, {
      paid: result.payment_status == 'paid'
    });
  },
  refund: async function (paymentId) {
    const result = await utils.fetch(`${apiUrl}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      },
      body: `payment_intent=${paymentId}`
    });
    return handleResult(result, {
      refunded: result.status == 'succeeded'
    });
  }
}
