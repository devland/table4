const config = require('./config.js');
const { getUrl } = require('../utils.js');
module.exports = {
  send: (options) => {
    return getUrl(config.url, {
      method: 'post',
      headers: {
        'User-Agent': 'table4/1.0',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        ...options,
        from: config.from
      })
    }, 'json');
  }
}
