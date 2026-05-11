module.exports = {
  log: (item) => {
    const now = new Date();
    process.stdout.write(`[${now.toISOString()}]: `);
    console.log(item);
  },
  handle: (response, error, output, headers = {}) => {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
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
}
