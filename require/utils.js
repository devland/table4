const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const ut = {
  parseNumber: (value) => {
    return isNaN(value) ? value : parseFloat(value);
  },
  fractional: (number) => { // returns fractional part of number
    return parseFloat('0.' + number.toString().split('.')?.[1] || '0');
  },
  fractionalCount: (number) => { // returns fractional digit count of number
    return (number.toString().split('.')?.[1] || '').length;
  },
  prx: (number) => { // returns 10 to the power of fractional digit count of number
    return Math.pow(10, ut.fractionalCount(number));
  },
  dgn: (number) => { // return digits as number; ex: 7.123 => 7123
    return number * ut.prx(number);
  },
  multiply: function () { // multiply without js rounding error
    let result = 1;
    for (let item of arguments) {
      prx = ut.prx(result) * ut.prx(item);
      result = ut.dgn(result) * ut.dgn(item) / prx;
    }
    return result;
  },
  sum: function () { // sum without js rounding error
    let result = 0;
    for (let item of arguments) {
      const maxPrx = Math.max(ut.prx(result), ut.prx(item));
      result = (ut.dgn(result) + ut.dgn(item)) / maxPrx;
    }
    return result;
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
    const included = {};
    let total = 0;
    for (let item of some) {
      if (includer.includes(item)) {
        included[item] ??= 0;
        included[item]++;
        total++;
      }
    }
    return { included, total };
  },
  getLanguages: () => {
    const languages = {};
    const list = fs.readdirSync('static/languages');
    for (let item of list) {
      const key = item.split('.')[0];
      languages[key] = require(`../static/languages/${item}`);
    }
    return languages;
  },
  getFlows: () => {
    const flowsPath = './require/flows';
    const flows = {};
    const list = fs.readdirSync(flowsPath)
    .map(fileName => path.join(flowsPath, fileName))
    .filter(filePath => fs.lstatSync(filePath).isDirectory())
    .map(folderPath => folderPath.split('/').pop());
    for (let item of list) {
      const stages = require(`./flows/${item}/flow.js`);
      flows[item] = {
        start: Object.keys(stages)[Object.values(stages).findIndex(item => item.start)],
        stages,
        triggers: require(`./flows/${item}/triggers.js`)
      }
    }
    return flows;
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
module.exports = ut;
