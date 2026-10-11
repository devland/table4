module.exports = {
  parseNumber: (value) => {
    return isNaN(value) ? value : parseFloat(value);
  },
  clean: (input) => { // removes non alpha numeric characters
    if (isNaN(input)) {
      return input.replaceAll(/[^a-z0-9_]/mgi, '');
    }
    else {
      return parseFloat(input);
    }
  },
  cleanKeys: (data) => {
    const fields = [];
    for (let key of Object.keys(data)) {
      if (typeof data[key] == 'undefined') {
        delete data[key];
        continue;
      }
      const name = module.exports.clean(key);
      fields.push(`"${name}" = :${name}`);
    }
    return fields;
  },
  arrayIncludesSome: (includer, some) => {
    for (let item of some) {
      if (includer.includes(item)) {
        return true;
      }
    }
    return false;
  },
  fetch: async (url, options, type = 'json') => {
    const result = await fetch(url, options);
    return await result[type]();
  },
  log: function () {
    const now = new Date();
    process.stdout.write(`[${now.toISOString()}]: `);
    for (let item of arguments) {
      if (typeof item == 'undefined') {
        continue;
      }
      console.log(item);
    }
  },
  handleRequest: (response, error, output, headers = {}) => {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (error) {
      response.writeHead(500, headers);
      response.write(JSON.stringify(error.stack ? {
        error: JSON.parse(JSON.stringify(error)),
        stack: error.stack
      } : {
        error
      }));
    }
    else {
      response.writeHead(200, headers);
      response.write(JSON.stringify({ output }));
    }
    response.end();
  }
}
