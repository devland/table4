const couch = require('./couch.js');
module.exports = function() {
  this.cache = {};
  this.authenticate = (tokenId) => {
    return new Promise((resolve, reject) => {
      const now = new Date();
      if (this.cache[tokenId]?.expiration > now) resolve(this.cache[tokenId]);
      else {
        let token;
        couch.get(`token:${tokenId}`)
          .then((result) => {
            result.expiration = new Date(result.expiration);
            token = result;
            if (result.expiration <= now) return Promise.reject(new Error('token_expired'));
            else return couch.get(`user:${result.name}`);
          })
          .then((result) => {
            this.cache[tokenId] = result;
            this.cache[tokenId].expiration = token.expiration;
            resolve(this.cache[tokenId]);
          })
          .catch((error) => {
            reject(new Error('authentication_failed'));
          });
      }
    });
  }
  this.clean = () => {
    const now = new Date();
    for (let key in this.cache) if (this.cache[key].expiration <= now) delete this.cache[key];
  }
}
