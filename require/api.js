module.exports = {
  'hello': (request, response) => {
    response.writeHead(200);
    response.write('Hello! :)');
    response.end();
  }
}
