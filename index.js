const fs = require('fs');
const https = require('https');
const config = require('./config.js');
const utils = require('./core/utils.js');
const core = new (require('./core/core.js'))();
const auth = new (require('./core/auth.js'))();
const listener = (request, response) => {
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
      request.body = body;
      if (apiPath[1] == 'api' && typeof core.methods[body.method] == 'function')
        if (body.method == 'users.login') {
          auth.clean();
          core.methods[body.method](request, response);
        }
        else auth.authenticate(request.headers.token)
          .then((result) => {
            request.user = result;
            core.methods[body.method](request, response);
          })
          .catch(utils.handleError(response));
      else {
        response.writeHead(400);
        response.end('{"error": "no_method"}');
      }
    }
    catch(error) {
      utils.handleError(response)(error);
    }
  });
};
const server = https.createServer({
  key: fs.readFileSync(config.sshKeyPath),
  cert: fs.readFileSync(config.sshCertPath)
}, listener);
server.on('error', (error) => {
  console.log('> server error');
  console.log(error);
});
server.on('close', () => {
  console.log('> server closing');
  process.exit(0);
});
process.on('SIGINT', () => {
  server.close();
});
server.listen({
  host: config.host,
  port: config.port
}, () => {
  console.log(`${config.name} server listening on port ${config.port}`);
});
