const utils = require('../utils.js');
const config = require('./config.js');
module.exports = {
  createCheckout: async (order) => {
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
    return await utils.fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      },
      body
    });
  },
  getCheckout: async (checkoutId) => {
    return await utils.fetch(`https://api.stripe.com/v1/checkout/sessions/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.secret}:`)
      }
    });
  }
}
