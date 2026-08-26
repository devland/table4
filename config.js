module.exports = {
  host: '5.13.236.95:8444', // service name; change this to your domain name
  secret: 'table4', // change this to a, preferably, random string
  port: 8443,
  base: './static/', // static files path (html, css, front-end js, media, etc)
  https: {
    key: './keys/privatekey.pem',
    cert: './keys/certificate.pem'
  },
  index: 'index.html',
  '404': '404.html',
  dbPath: 'table4.db',
  tokenDuration: 3600000 * 8 // in milliseconds
}
