const crypto = require('crypto');
const config = require('../config.js');
const passhash = require('./passhash.js');
const access = require('./access.js');
const { log, handle } = require('../require/utils.js');
const db = new (require('./db.js'))({ dbPath: config.dbPath });
this.hooks = {}
const loadPlugins = () => {
  this.hooks = {}
  let result = db.plugins.getAll();
  for (let item of result) {
    if (item.active != 'true') {
      continue;
    }
    const plugin = require(`../plugins/${item.name}`);
    for (let method in plugin) {
      if (!this.hooks[method]) {
        this.hooks[method] = {
          main: null,
          before: [],
          after: []
        }
      }
      if (plugin[method].main) {
        module.exports[method] = plugin[method].main;
      }
      if (plugin[method].before) {
        this.hooks[method].before.push(plugin[method].before);
      }
      if (plugin[method].after) {
        this.hooks[method].after.push(plugin[method].after);
      }
    }
  }
  log(`active plugins: ${Object.keys(this.hooks)}`);
}
const isAllowed = (request, response) => {
  if (!request.table4.user || !request.table4.token) {
    handle(response, 'not_logged_in');
    return false;
  }
  const now = new Date();
  if (request.table4.token.expires_at < now) {
    handle(response, 'token_expired');
    return false;
  }
  const rights = access[request.table4.user.type];
  if (!rights) {
    handle(response, 'invalid_user_type');
    return false;
  }
  const method = request.table4.body.method;
  if (rights.allowed != '*' && (!rights.allowed.includes(method) || rights.notAllowed.includes(method))) {
    handle(response, 'access_denied');
    return false;
  }
  return true;
}
module.exports = {
  'request': (request, response) => {
    let data = '';
    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('end', () => {
      try {
        const body = JSON.parse(data);
        if (module.exports[body.method] && body.method != 'request') {
          request.table4 = { body };
          if (body.token) {
            const token = db.tokens.get({ token: body.token });
            if (!token) {
              handle(response, 'wrong_token_user');
              return;
            }
            token.expires_at = new Date(token.expires_at);
            const user = db.users.get({ id: token.user_id });
            if (!user) {
              handle(response, 'wrong_token_user');
              return;
            }
            request.table4.token = token;
            request.table4.user = user;
            if (!isAllowed(request, response)) {
              return;
            }
          }
          if (this.hooks[body.method]) {
            for (let hook of this.hooks[body.method].before) {
              hook(request, response);
            }
          }
          module.exports[body.method](request, response);
          if (this.hooks[body.method]) {
            for (let hook of this.hooks[body.method].after) {
              hook(request, response);
            }
          }
        }
        else {
          handle(response, 'wrong_method');
        }
      }
      catch (error) {
        handle(response, error);
      }
    });
  },
  'signup': (request, response) => {
    const user = db.users.get({ email: request.table4.body.input.email });
    if (!user) {
      const hash = passhash.hash(request.table4.body.input.password, Buffer.from(config.secret));
      const result = db.users.add({
        email: request.table4.body.input.email,
        password: hash,
        type: 'customer'
      });
      handle(response, null, result);
    }
    else {
      handle(response, 'email_taken');
    }
  },
  'login': (request, response) => {
    const user = db.users.get({ email: request.table4.body.input.email });
    if (!user) {
      handle(response, 'wrong_email_password');
      return;
    }
    const verified = passhash.verify(user.password, request.table4.body.input.password, Buffer.from(config.secret));
    if (user && verified) {
      db.tokens.clean(user.id);
      const token = crypto.randomUUID();
      const result = db.tokens.add({
        token,
        user_id: user.id
      }, config.tokenDuration);
      if (result.lastInsertRowid) {
        handle(response, null, { token });
      }
      else {
        handle(response, result);
      }
    }
    else {
      handle(response, 'wrong_email_password');
    }
  },
  'changePassword': (request, response) => {
    const input = request.table4.body.input;
    const user = request.table4.user;
    const verified = passhash.verify(user.password, input.password, Buffer.from(config.secret));
    if (!verified) {
      handle(response, 'wrong_password');
      return;
    }
    if (input.newPassword != input.retypedNewPassword) {
      handle(response, 'retyped_mismatch');
      return;
    }
    const hash = passhash.hash(input.newPassword, Buffer.from(config.secret));
    const result = db.users.setPassword({
      password: hash,
      id: user.id
    });
    handle(response, null, result);
  }
}
loadPlugins();
