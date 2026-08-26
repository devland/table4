const crypto = require('crypto');
const fs = require('fs');
const config = require('../config.js');
const passhash = require('./passhash.js');
const access = require('./access.js');
const { log, handleRequest } = require('../require/utils.js');
const email = require('./email');
const db = new (require('./db.js'))({ dbPath: config.dbPath });
this.languages = {}
const loadLanguages = () => {
  const result = fs.readdirSync('static/languages');
  for (let item of result) {
    const key = item.split('.')[0];
    this.languages[key] = require(`../static/languages/${item}`);
  }
}
module.exports = {
  'request': (request, response) => {
    const benchmarkStart = performance.now();
    let data = '';
    let body = {};
    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('end', async () => {
      try {
        body = JSON.parse(data);
        if (body.method == 'request' || !module.exports[body.method]) {
          throw 'method_not_found';
          return;
        }
        request.table4 = { body };
        if (body.token) {
          const token = db.tokens.getFirst({ token: body.token });
          if (!token) {
            throw 'token_not_found';
            return;
          }
          token.expires_at = new Date(token.expires_at);
          const user = db.users.getFirst({ id: token.user_id });
          if (!user) {
            throw 'token_user_not_found';
            return;
          }
          request.table4.token = token;
          request.table4.user = user;
        }
        const now = new Date();
        if (request.table4.token && request.table4.token.expires_at < now) {
          throw 'token_expired';
          return;
        }
        let allowed = access['everyone'];
        if (request.table4.user) {
          allowed = allowed.concat(access[request.table4.user.type]);
        }
        const method = request.table4.body.method;
        if (!allowed.includes('*') && !allowed.includes(method)) {
          throw 'access_denied';
          return;
        }
        await module.exports[body.method](request, response);
        const benchmarkEnd = performance.now();
        log(`${request.url}/${body.method} [${response.statusCode}] (${(benchmarkEnd - benchmarkStart)} ms, ip ${request.socket.remoteAddress})`);
      }
      catch (error) {
        handleRequest(response, error);
        const benchmarkEnd = performance.now();
        let label = 'error';
        if (typeof error == 'string') {
          label = error;
          error = undefined;
        }
        log(`[${label}] ${request.url}/${body.method} [${response.statusCode}] (${(benchmarkEnd - benchmarkStart)} ms, ip ${request.socket.remoteAddress})`, error);
      }
    });
  },
  'signup': (request, response) => {
    const user = db.users.getFirst({ email: request.table4.body.input.email });
    if (!user) {
      const hash = passhash.hash(request.table4.body.input.password, Buffer.from(config.secret));
      const result = db.users.add({
        email: request.table4.body.input.email,
        password: hash,
        type: 'user'
      });
      handleRequest(response, null, result);
    }
    else {
      throw 'email_taken';
    }
  },
  'login': (request, response) => {
    const user = db.users.getFirst({ email: request.table4.body.input.email });
    if (!user) {
      throw 'wrong_email_password';
      return;
    }
    const verified = passhash.verify(user.password, request.table4.body.input.password, Buffer.from(config.secret));
    if (!verified) {
      throw 'wrong_email_password';
      return;
    }
    db.tokens.clean(user.id);
    const token = crypto.randomUUID();
    const result = db.tokens.add({
      token,
      user_id: user.id
    }, config.tokenDuration);
    if (!result.lastInsertRowid) {
      throw new Error(result);
      return;
    }
    handleRequest(response, null, { token });
  },
  'changePassword': async (request, response) => {
    const input = request.table4.body.input;
    const user = request.table4.user;
    const verified = passhash.verify(user.password, input.password, Buffer.from(config.secret));
    if (!verified) {
      throw 'wrong_password';
      return;
    }
    if (input.newPassword != input.retypedNewPassword) {
      throw 'retyped_mismatch';
      return;
    }
    const hash = passhash.hash(input.newPassword, Buffer.from(config.secret));
    const result = db.users.setPassword({
      password: hash,
      id: user.id
    });
    now = new Date();
    await email.send({
      to: user.email,
      subject: `${config.host} - ${lang.passwordChanged}`,
      text: `${lang.passwordChanged} @ ${now.toString()}`
    });
    handleRequest(response, null, result);
  },
  'sendPasswordResetCode': async (request, response) => {
    const input = request.table4.body.input;
    const user = db.users.getFirst({ email: input.email });
    if (user) {
      db.reset_codes.clean(user.id);
      const code = crypto.randomUUID();
      let result = db.reset_codes.add({
        code,
        user_id: user.id,
        type: 'password'
      }, config.tokenDuration);
      if (!result.lastInsertRowid) {
        throw new Error(result);
        return;
      }
      const lang = this.languages[input.language] ? this.languages[input.language] : this.languages['en'];
      result = await email.send({
        to: input.email,
        subject: `${config.host} - ${lang.resetPassword}`,
        text: `${lang.resetPasswordCode}: ${code}`
      });
      if (!result.id) {
        throw new Error(result);
        return;
      }
    }
    handleRequest(response, null, 'done');
  },
  'resetPassword': async (request, response) => {
    const input = request.table4.body.input;
    const resetCode = db.reset_codes.get({
      code: input.resetCode,
      type: 'password'
    });
    if (!resetCode) {
      throw 'reset_code_not_found';
      return;
    }
    let now = new Date();
    resetCode.expires_at = new Date(resetCode.expires_at);
    if (resetCode.expires_at < now) {
      throw 'reset_code_expired';
      return;
    }
    if (input.newPassword != input.retypedNewPassword) {
      throw 'retyped_mismatch';
      return;
    }
    const hash = passhash.hash(input.newPassword, Buffer.from(config.secret));
    let result = db.users.setPassword({
      password: hash,
      id: resetCode.user_id
    });
    db.reset_codes.clean(resetCode.user_id);
    const user = db.users.getFirst({ id: resetCode.user_id });
    const lang = this.languages[input.language] ? this.languages[input.language] : this.languages['en'];
    now = new Date();
    await email.send({
      to: user.email,
      subject: `${config.host} - ${lang.passwordChanged}`,
      text: `${lang.passwordChanged} @ ${now.toString()}`
    });
    handleRequest(response, null, result);
  },
  'sendEmailChangeCode': async (request, response) => {
    const input = request.table4.body.input;
    const user = request.table4.user;
    const verified = passhash.verify(user.password, input.password, Buffer.from(config.secret));
    if (!verified) {
      throw 'wrong_password';
      return;
    }
    db.reset_codes.clean(user.id);
    const code = crypto.randomUUID();
    let result = db.reset_codes.add({
      code,
      user_id: user.id,
      type: 'email',
      data: JSON.stringify({ email: input.email })
    }, config.tokenDuration);
    if (!result.lastInsertRowid) {
      throw new Error(result);
      return;
    }
    const lang = this.languages[input.language] ? this.languages[input.language] : this.languages['en'];
    result = await email.send({
      to: input.email,
      subject: `${config.host} - ${lang.changeEmail}`,
      text: `${lang.changeEmailCode}: ${code}`
    });
    if (!result.id) {
      throw new Error(result);
      return;
    }
    handleRequest(response, null, 'done');
  },
  'changeEmail': async (request, response) => {
    const input = request.table4.body.input;
    const resetCode = db.reset_codes.get({
      code: input.resetCode,
      type: 'email'
    });
    if (!resetCode) {
      throw 'reset_code_not_found';
      return;
    }
    let now = new Date();
    resetCode.expires_at = new Date(resetCode.expires_at);
    if (resetCode.expires_at < now) {
      throw 'reset_code_expired';
      return;
    }
    resetCode.data = JSON.parse(resetCode.data);
    let result = db.users.set({
      id: resetCode.user_id,
      email: resetCode.data.email
    });
    db.reset_codes.clean(resetCode.user_id);
    const user = db.users.getFirst({ id: resetCode.user_id });
    const lang = this.languages[input.language] ? this.languages[input.language] : this.languages['en'];
    now = new Date();
    await email.send({
      to: user.email,
      subject: `${config.host} - ${lang.emailChanged}`,
      text: `${lang.emailChanged} @ ${now.toString()}`
    });
    handleRequest(response, null, result);
  },
  'getUsers': (request, response) => {
    const input = request.table4.body.input;
    const result = db.users.get({
      id: input.id,
      email: input.email,
      type: input.type
    }, input.limit, input.offset);
    handleRequest(response, null, result);
  },
  'getTagKeys': (request, response) => {
    const input = request.table4.body.input;
    const result = db.tagKeys.get(input);
    handleRequest(response, null, result);
  },
  'updateTagKeys': (request, response) => {
    const input = request.table4.body.input;
    const result = db.tagKeys.update(input);
    handleRequest(response, null, result);
  },
  'getTags': (request, response) => {
    const input = request.table4.body.input;
    const result = db.tags.get(input);
    handleRequest(response, null, result);
  },
  'updateTags': (request, response) => {
    const input = request.table4.body.input;
    const result = db.tags.update(input);
    handleRequest(response, null, result);
  },
  'getCurrencies': (request, response) => {
    const result = db.currencies.get();
    handleRequest(response, null, result);
  },
  'updateCurrencies': (request, response) => {
    const input = request.table4.body.input;
    const result = db.currencies.update(input);
    handleRequest(response, null, result);
  },
  'getPrices': (request, response) => {
    const input = request.table4.body.input;
    const result = db.prices.get(input);
    handleRequest(response, null, result);
  },
  'updatePrices': (request, response) => {
    const input = request.table4.body.input;
    const result = db.prices.update(input);
    handleRequest(response, null, result);
  },
  'getProducts': (request, response) => {
    const input = request.table4.body.input;
    const result = db.products.get(input);
    handleRequest(response, null, result);
  },
  'findProducts': (request, response) => {
    const input = request.table4.body.input;
    const result = db.products.find(input);
    handleRequest(response, null, result);
  },
  'updateProducts': (request, response) => {
    const input = request.table4.body.input;
    const result = db.products.update(input);
    handleRequest(response, null, result);
  },
  'getCart': (request, response) => {
    const input = request.table4.body.input;
    const result = db.cart.get(input);
    handleRequest(response, null, result);
  },
  'updateCart': (request, response) => {
    const input = request.table4.body.input;
    const result = db.cart.update(input);
    handleRequest(response, null, result);
  },
  'getOrderFlows': (request, response) => {
    const input = request.table4.body.input;
    const result = db.orderFlows.get(input);
    handleRequest(response, null, result);
  },
  'updateOrderFlows': (request, response) => {
    const input = request.table4.body.input;
    const result = db.orderFlows.update(input);
    handleRequest(response, null, result);
  },
  'getOrders': (request, response) => {
    const input = request.table4.body.input;
    const result = db.orders.get({
      id: input.id,
      user_id: input.user_id,
      uuid: input.uuid
    }, input.limit, input.offset);
    handleRequest(response, null, result);
  },
  'updateOrders': (request, response) => {
    // check if user owns order
    const input = request.table4.body.input;
    const result = db.orders.update(input);
    handleRequest(response, null, result);
  },
}
loadLanguages();
