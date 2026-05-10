const crypto = require('crypto');
const config = require('../config.js');
const passhash = require('./passhash.js');
const { log } = require('../require/utils.js');
const db = new (require('./db.js'))({ dbPath: config.dbPath });
const handle = (response, error, output) => {
  const headers = { 'Content-Type': 'application/json' }
  if (error) {
    response.writeHead(500, headers);
    response.write(JSON.stringify({
      error: error.toString(),
      stack: error.stack
    }));
  }
  else {
    response.writeHead(200, headers);
    response.write(JSON.stringify({ output }));
  }
  response.end();
}
this.hooks = {}
const loadHooks = () => {
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
          before: [],
          after: []
        }
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
loadHooks();
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
            const user = db.users.get({ id: token.user_id });
            request.table4.token = token;
            request.table4.user = user;
          }
          // before method
          if (this.hooks[body.method]) {
            for (let hook of this.hooks[body.method].before) {
              hook.before(request, response);
            }
          }
          // run method
          module.exports[body.method](request, response);
          // after method
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
  'hello': (request, response) => {
    handle(response, null, 'Hi. :)');
  },
  'signup': (request, response) => {
    const user = db.users.get({ email: request.table4.body.input.email });
    if (!user) {
      const hash = passhash.hash(request.table4.body.input.password, Buffer.from(config.secret));
      const result = db.users.add({
        email: request.table4.body.input.email,
        password: hash,
        type: 'client'
      });
      handle(response, null, result);
    }
    else {
      handle(response, 'email_taken');
    }
  },
  'login': (request, response) => {
    const user = db.users.get({ email: request.table4.body.input.email });
    const verified = passhash.verify(user.password, request.table4.body.input.password, Buffer.from(config.secret));
    if (user && verified) {
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
  }
}
