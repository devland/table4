const path = require('path');
const https = require('https');
const fs = require('fs');
const mimes = require('./require/mimes.js');
const api = require('./require/api.js');
const config = require('./config.js');
const options = {
  key: config.https.key ? fs.readFileSync(config.https.key) : null,
  cert: config.https.cert ? fs.readFileSync(config.https.cert) : null
}
const { log } = require('./require/utils.js');
const getMimeType = (extension) => {
  for (let item of mimes) {
    if (item.extensions.includes(extension)) {
      return item.type;
    }
  }
  return null;
}
const getExtension = (path) => {
  const parts = path.split('/');
  const pieces = [];
  for (let item of parts) {
    if (item) {
      pieces.push(item);
    }
  }
  if (!pieces.length) {
    return null;
  }
  return '.' + pieces.pop().split('.').pop();
}
const handleStatic = (request, response) => {
  let filePath;
  let benchmarkStart = performance.now();
  try {
    if (!request.url) {
      log('[nope] wrong request');
      response.end();
      return;
    }
    let url = new URL(path.join('http://localhost', request.url));
    let extension;
    let result;
    let headers = {};
    const fourOhFourPath = path.join(config.base, config['404']);
    filePath = path.join(config.base, url.pathname);
    let httpCode;
    if (fs.existsSync(filePath)) {
      let stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        url = new URL(path.join(url.href, config.index));
        headers['Location'] = url.pathname;
        httpCode = 301;
        result = '';
      }
      else {
        extension = getExtension(url.pathname);
        httpCode = 200;
        result = fs.readFileSync(filePath, 'binary');
      }
    }
    else if (fs.existsSync(fourOhFourPath)) {
      url = new URL(path.join(url.origin, config['404']));
      extension = getExtension(url.pathname);
      headers['Location'] = url.pathname;
      httpCode = 301;
      result = '';
    }
    else {
      httpCode = 404;
      result = 'nope :(';
    }
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
    const benchmarkEnd = performance.now();
    log(`${filePath} [${httpCode}] (${(benchmarkEnd - benchmarkStart)} ms)`);
  }
  catch (error) {
    response.writeHead(500);
    response.write(error.message, 'binary');
    response.end();
    const benchmarkEnd = performance.now();
    log(`[error] ${filePath} (${(benchmarkEnd - benchmarkStart)} ms)`, error);
  }
}
https.createServer(options, (request, response) => {
  try {
    if (request.url == '/api') {
      api.request(request, response);
    }
    else {
      handleStatic(request, response);
    }
  }
  catch (error) {
    log(error);
    response.writeHead(500);
    response.write(error.toString(), 'binary');
    response.end();
  }
}).listen(parseInt(config.port));
log(`table4 server running on port ${config.port}`);
