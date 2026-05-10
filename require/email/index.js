const config = require('./config.js');
module.exports = {
  send: async (options) => {
    return await (await fetch(config.url, {
      method: 'post',
      headers: {
        'User-Agent': 'table4/1.0',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        ...options,
        from: config.from
      })
    })).json();
  }
}
