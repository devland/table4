const config = require('../config.js');
const utils = require('./utils.js');
const options = {
  headers: {
    Accept: 'application/json',
    'X-Auth-CouchDB-Roles': '_admin',
    'X-Auth-CouchDB-UserName': config.dbUser,
    'X-Auth-CouchDB-Token': config.dbToken
  }
}
module.exports = {
  dbInfo: () => {
    return utils.fetch('get', config.dbUrl, options);
  }
}
