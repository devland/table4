module.exports = {
  getUrl: async (url, options, type) => {
    const result = await fetch(url, options);
    return await result[type]();
  },
  log: (item) => {
    const now = new Date();
    process.stdout.write(`[${now.toISOString()}]: `);
    console.log(item);
  },
  handleRequest: (response, error, output, headers = {}) => {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (error) {
      response.writeHead(500, headers);
      response.write(JSON.stringify(error.stack ? {
        error: error.toString(),
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
