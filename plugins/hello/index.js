const { handleRequest } = require('../../require/utils.js');
module.exports = {
  hello: {
    main: (request, response) => {
      handleRequest(response, null, 'Hi. :)');
    }
  }
}
