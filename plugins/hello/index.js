const { handle } = require('../../require/utils.js');
module.exports = {
  hello: {
    main: (request, response) => {
      handle(response, null, 'Hi. :)');
    }
  }
}
