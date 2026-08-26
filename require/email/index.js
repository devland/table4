const config = require('./config.js');
const utils = require('../utils.js');
module.exports = {
  send: (options) => {
    return utils.fetch(config.url, {
      method: 'post',
      headers: {
        'User-Agent': 'table4/1.0',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        ...options,
        from: config.from
      })
    });
  }
}
