const utils = require('../core/utils.js');
const couch = require('../core/couch.js');
const config = require('../config.js');
const roles = ['client', 'waiter', 'manager', 'admin'];
module.exports = {
  'users.dbInfo': (request, response) => {
    if (!request.user.roles.includes('admin')) return utils.handleError(response)(new Error('access_denied'));
    couch.dbInfo()
      .then(utils.handleResult(response))
      .catch(utils.handleError(response));
  },
  'users.upsert': (request, response) => {
    const nameTester=new RegExp(/^[a-z0-9_]+$/i);
    if (typeof request?.body?.name != 'string' || request.body.name.length < 8 || !nameTester.test(request.body.name))
      return utils.handleError(response)(new Error('invalid_name'));
    const keyTester=new RegExp(/^[a-z0-9]+$/i);
    if (typeof request.body.key != 'string' || request.body.key.length != 40 || !keyTester.test(request.body.key))
      return utils.handleError(response)(new Error('invalid_key'));
    if (!Array.isArray(request.body.roles) || !request.body.roles.length)
      return utils.handleError(response)(new Error('invalid_roles'));
    let maxRole = -1;
    let maxWanted = -1;
    let rolesOk = true;
    for (let item of request.user.roles) {
      const index = roles.indexOf(item);
      if (index > maxRole) maxRole = index;
    }
    for (let item of request.body.roles) {
      const index = roles.indexOf(item);
      if (index > maxWanted) maxWanted = index;
    }
    if (maxWanted < 0) return utils.handleError(response)(new Error('invalid_roles'));
    if (maxWanted > maxRole) return utils.handleError(response)(new Error('access_denied'));
    couch.get(`user:${request.body.name}`)
      .then((result) => {
        if (request.body.rev || !result) return couch.upsert({
          type: 'user',
          name: result?.name || request.body.name,
          key: request.body.key,
          roles: request.body.roles
        }, `user:${request.body.name}`, request.body.rev);
        else return Promise.reject(new Error('user_exists'));
      })
      .then(utils.handleResult(response))
      .catch(utils.handleError(response));
  },
  'users.login': (request, response) => {
    couch.get(`user:${request?.body?.name}`)
      .then((result) => {
        if (result?.key == request?.body?.key) return couch.find({
          selector: {
            type: { '$eq': 'token' },
            name: { '$eq': request.body.name }
          }
        })
        else return Promise.reject(new Error('login_failed'));
      })
      .then((result) => {
        const body = {};
        for (let item of result.docs) body[item._id] = [item._rev];
        if (Object.keys(body).length) return couch.purge(body);
        else return Promise.resolve();
      })
      .then((result) => {
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);
        return couch.upsert({
          type: 'token',
          name: request.body.name,
          expiration
        }, `token:${utils.hash(`token:${request.body.name}:${expiration.getTime()}`, config.hashSecret)}`);
      })
      .then((result) => {
        utils.handleResult(response)({ token: result?.id.split(':')[1] });
      })
      .catch(utils.handleError(response));
  }
}
