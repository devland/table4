const { argon2Sync, randomBytes, timingSafeEqual } = require('crypto');
const toB64NoPad = (str) => {
  return str.toString('base64').replace(/={1,2}$/, '');
}
module.exports = {
  hash: (message, secret, options = {}) => {
    const algorithm = 'argon2id';
    const version = '19';
    const params = {
      message,
      nonce: options.nonce || randomBytes(16),
      parallelism: options.parallelism || 4,
      tagLength: options.tagLength || 64,
      memory: options.memory || 65536,
      passes: options.passes || 3,
      secret
    }
    const hash = argon2Sync(algorithm, params);
    return [`$${algorithm}`, `v=${version}`, `m=${params.memory},t=${params.passes},p=${params.parallelism}`, toB64NoPad(params.nonce), toB64NoPad(hash)].join('$');
  },
  verify: (phcString, message, secret) => {
    const phcParams = phcString.split('$');
    const argon2Params = Object.fromEntries(phcParams[3].split(',').map(p => p.split('=')));
    const nonce = Buffer.from(phcParams[4], 'base64');
    const hash = Buffer.from(phcParams[5], 'base64');
    const freshHash = argon2Sync(phcParams[1], {
      message,
      nonce,
      memory: Number(argon2Params.m),
      passes: Number(argon2Params.t),
      parallelism: Number(argon2Params.p),
      tagLength: hash.length,
      secret
    });
    return timingSafeEqual(hash, freshHash);
  }
}
