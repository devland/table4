const net = {
  'http:': require('http'),
  'https:': require('https')
}
module.exports = {
  handleResult: (response) => {
    return (result) => {
      response.writeHead(result.status || 200);
      response.end(result.body);
    }
  },
  handleError: (response, status) => {
    return (error) => {
      console.log(error);
      response.writeHead(status || 500);
      response.end(`{ "error": "${error.message}" }`);
    }
  },
  fetch: (method, url, options) => {
    return new Promise((resolve, reject) => {
      try {
        let protocol = 'https';
        if (typeof options == 'undefined') options = {};
        if (url) {
          const parsedUrl = new URL(url);
          options.hostname = parsedUrl.hostname;
          options.path = parsedUrl.pathname;
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
        request.end();
      }
      catch(error) {
        reject(error);
      }
    });
  }
}
