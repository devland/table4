module.exports = {
  name: 'table4', // change this to your restaurant name
  secret: 'table4', // change this
  port: 8443,
  base: './static/',
  dbPath: 'table4.db',
  '404': '404.html',
  tokenDuration: 3600000 * 3 // in milliseconds
}
