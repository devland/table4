const name = 'table4two';
module.exports = {
  name,
  port: process.env[`${name}_port`] || 8080
}
