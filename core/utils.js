const crypto = require('crypto');
const net = {
  'http:': require('http'),
  'https:': require('https')
}
module.exports = {
  handleResult: (response) => {
    return (result) => {
      response.writeHead(200);
      if (typeof result == 'object') result = JSON.stringify(result);
      response.end(result);
    }
  },
  handleError: (response) => {
    return (error) => {
      const now = new Date();
      console.log(`> ${now} .${now.getMilliseconds()} > error`);
      console.log(error);
      response.writeHead(error?.status || 500);
      if (error.message) response.end(`{ "error": "${error?.message}" }`);
      else response.end(error?.body || error);
    }
  },
  handleCouchPromise: (promise) => {
    return new Promise((resolve, reject) => {
      promise
        .then((result) => {
          try {
            if (![200, 201, 404].includes(result?.status)) reject(result?.body);
            else if (JSON.parse(result?.body)?.error == 'not_found') resolve();
            else resolve(JSON.parse(result.body.docs || result.body));
          }
          catch(error) {
            reject(error);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  fetch: (method, url, options, body) => {
    return new Promise((resolve, reject) => {
      try {
        let protocol = 'https';
        if (typeof options == 'undefined') options = {};
        if (url) {
          const parsedUrl = new URL(url);
          options.hostname = parsedUrl.hostname;
          options.path = `${parsedUrl.pathname}${parsedUrl.search}`;
          options.port = parsedUrl.port;
          protocol = parsedUrl.protocol;
        }
        options.method = method || options.method || 'get';
        const request = net[protocol].request(options, (result) => {
          result.setEncoding('utf8');
          const output = { body: '' };
          output.status = result.statusCode;
          output.headers = result.headers;
          result.on('data', (chunk) => {
            output.body += chunk;
          });
          result.on('end', () => {
            resolve(output);
          });
        });
        request.on('error', (error) => {
          reject(error);
        });
        if (body) request.write(body);
        request.end();
      }
      catch(error) {
        reject(error);
      }
    });
  },
  hash: (input, secret) => {
    return crypto.createHmac('sha1', secret).update(input).digest('hex');
  }
}
