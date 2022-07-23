module.exports = {
  login: (request, response) => {
    response.writeHead(200);
    response.end('{"token": "logged_in"}');
  }
}
