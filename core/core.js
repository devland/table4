const users = require('../api/users.js');
module.exports = function(options) {
  this.methods = {
    'core.hello': (request, response) => {
      response.writeHead(200);
      response.end('{"message": "hello"}');
    }
  }
  this.methods = {...this.methods, ...users};
}
