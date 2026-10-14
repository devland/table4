module.exports = {
  host: 'table4', // service name; change this to your domain name
  secret: 'table4', // change this; used for password hashing
  port: 8443, // default is 443 for production
  base: './static/', // static files path (html, css, front-end js, media, etc)
  https: {
    key: './keys/privatekey.pem',
    cert: './keys/certificate.pem'
  },
  index: 'index.html',
  '404': '404.html',
  dbPath: 'table4.db',
  tokenDuration: 3600000 * 8, // in milliseconds
  users: { // main user types; define more in require/access.js
    admin: 'admin',
    client: 'client',
    everyone: 'everyone'
  }
}
