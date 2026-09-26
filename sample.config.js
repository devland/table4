module.exports = {
  name: 'table4', // service name; change this to your domain name
  secret: 'table4', // change this; used for password hashing
  port: 8443, // default is 443 for production
  base: './static/', // static files path (html, css, front-end js, media, etc)
  dbPath: 'table4.db',
  '404': '404.html',
  tokenDuration: 3600000 * 8 // in milliseconds
}
