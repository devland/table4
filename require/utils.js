const fs = require('fs');
const path = require('path');
const flowsPath = './require/flows';
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
  getFlows: () => {
    const folderPath = flowsPath;
    return fs.readdirSync(folderPath)
    .map(fileName => path.join(folderPath, fileName))
    .filter(filePath => fs.lstatSync(filePath).isDirectory())
    .map(folderPath => folderPath.split('/').pop());
  },
  flowExists: (flowName) => {
    const folderPath = path.join(flowsPath, flowName);
    return fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory();
  },
  getFirstFlowStatus: (flowName) => {
    const flow = JSON.parse(fs.readFileSync(path.join(flowsPath, flowName, 'flow.json')));
    return Object.keys(flow)[Object.values(flow).findIndex(item => item.first)];
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
