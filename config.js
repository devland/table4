const name = 'table4';
module.exports = {
  name,
  host: process.env[`${name}_host`] || 'localhost',
  port: process.env[`${name}_port`] || 8080,
  dbUrl: process.env[`${name}_dbUrl`] || 'http://127.0.0.1:5984/table4',
  dbUser: process.env[`${name}_dbUser`] || 'admin',
  dbToken: process.env[`${name}_dbUserName`] || '2d5c36cf2514a02970a609c26d514ee443b92951'
}
