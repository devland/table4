module.exports = {
  name: 'table4', // service name; change this
  secret: 'table4', // change this to a, preferably, random string
  port: 8443, // default is 443 for production
  base: './static/', // static files path (html, css, front-end js, media, etc)
  dbPath: 'table4.db',
  '404': '404.html',
  tokenDuration: 3600000 * 8 // in milliseconds
}
