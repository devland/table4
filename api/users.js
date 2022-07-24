const utils = require('../core/utils.js');
const couch = require('../core/couch.js');
module.exports = {
  dbInfo: (request, response) => {
    couch.dbInfo()
      .then(utils.handleResult(response))
      .catch(utils.handleError(response));
  },
  login: (request, response) => {
    response.writeHead(200);
    response.end('{"token": "logged_in"}');
  }
}
