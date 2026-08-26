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
