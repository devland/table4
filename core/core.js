const fs = require('fs');
const apis = fs.readdirSync('api');
module.exports = function(options) {
  this.methods = {
    'core.hello': (request, response) => {
      response.writeHead(200);
      response.end('{"message": "hello"}');
    }
  }
  for (let item of apis) {
    const api = require(`../api/${item}`);
    this.methods = {...this.methods, ...api};
  }
}
