const fs = require('fs');
const https = require('https');
const config = require('./config.js');
const core = new (require('./core/core.js'))();
const listener = function (request, response) {
  response.setHeader('Content-Type', 'application/json');
  const parsedUrl = new URL(request.url, `https://${config.host}`);
  const apiPath = parsedUrl.pathname.split('/');
  let body = '';
  request.on('data', chunk => {
    body += chunk;
  });
  request.on('end', () => {
    try {
      body = body ? JSON.parse(body) : {};
    }
    catch(error) {
      response.writeHead(500);
      return response.end('{"error": "invalid_json_body"}');
    }
    if (apiPath[1] == 'api' && typeof core.methods[body.method] == 'function')
      core.methods[body.method](request, response);
    else {
      response.writeHead(200);
      response.end('{"error": "no_method"}');
    }
  });
};
const server = https.createServer({
  key: fs.readFileSync(process.env.table4_key_path || 'keys/key.pem'),
  cert: fs.readFileSync(process.env.table4_cert_path || 'keys/cert.pem')
}, listener);
server.on('error', (error) => {
  console.log(error);
});
server.on('close', (error) => {
  console.log('server closing...');
  console.log(error);
});
server.listen({
  host: config.host,
  port: config.port
}, () => {
  console.log(`${config.name} server listening on port ${config.port}`);
});
