const config = require('../config.js');
const utils = require('./utils.js');
const options = {
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-CouchDB-Roles': '_admin',
    'X-Auth-CouchDB-UserName': config.dbUser,
    'X-Auth-CouchDB-Token': config.dbToken
  }
}
module.exports = {
  dbInfo: () => {
    return utils.handleCouchPromise(utils.fetch('get', config.dbUrl, options));
  },
  index: (body) => {
    return utils.handleCouchPromise(utils.fetch('post', `${config.dbUrl}/_index`, options, JSON.stringify(body)));
  },
  get: (id) => {
    return utils.handleCouchPromise(utils.fetch('get', `${config.dbUrl}/${id}`, options));
  },
  find: (body) => {
    return utils.handleCouchPromise(utils.fetch('post', `${config.dbUrl}/_find`, options, JSON.stringify(body)));
  },
  upsert: (body, id, rev) => {
    return utils.handleCouchPromise(utils.fetch(id ? 'put' : 'post', `${config.dbUrl}/${id || ''}${rev ? `?rev=${rev}` : ''}`, options, JSON.stringify(body)));
  },
  delete: (id, rev) => {
    return utils.handleCouchPromise(utils.fetch('delete', `${config.dbUrl}/${id}?rev=${rev}`, options));
  },
  purge: (body) => {
    return utils.handleCouchPromise(utils.fetch('post', `${config.dbUrl}/_purge`, options, JSON.stringify(body)));
  }
}
