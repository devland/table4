const https = require('https');
const fs = require('fs');
const api = require('./require/api.js');
const mimes = require('./require/mimes.js');
const config = require('./config.js');
const options = {
  key: fs.readFileSync('keys/privatekey.pem'),
  cert: fs.readFileSync('keys/certificate.pem')
}
const log = (item) => {
  const now = new Date();
  process.stdout.write(`[${now.toISOString()}]: `);
  console.log(item);
}
const getMimeType = (extension) => {
  for (let item of mimes) {
    if (item.extensions.includes(extension)) {
      return item.type;
    }
  }
  return null;
}
const handleStatic = (url, response) => {
  const parts = url.split('/');
  const pieces = [];
  for (let item of parts) {
    if (item) {
      pieces.push(item);
    }
  }
  let path = pieces.join('/');
  let extension = '.' + pieces.pop().split('.').pop();
  let result;
  const headers = {};
  let httpCode = 200;
  if (fs.existsSync(config.base + path)) {
    result = fs.readFileSync(config.base + path, 'binary');
  }
  else {
    path = config['404'];
    result = fs.readFileSync(config.base + path, 'binary');
    extension = '.' + config['404'].split('/').pop().split('.').pop();
    headers['Location'] = '/404.html';
    httpCode = 301;
  }
  const mimeType = getMimeType(extension);
  if (mimeType) {
    headers['Content-Type'] = mimeType;
  }
  response.writeHead(httpCode, headers);
  response.write(result, 'binary');
  response.end();
}
https.createServer(options, (request, response) => {
  try {
    const benchmarkStart = new Date();
    if (request.url == '/api') {
      api.hello(request, response);
    }
    else {
      handleStatic(request.url, response);
    }
    const benchmarkEnd = new Date();
    log(`${request.url} (${(benchmarkEnd - benchmarkStart)} ms)`);
  }
  catch (error) {
    log(error);
    response.writeHead(500);
    response.write(error.toString(), 'binary');
    response.end();
  }
}).listen(parseInt(config.port));
log(`static file server running at http://localhost:${config.port}`);
log('using config');
log(config);
