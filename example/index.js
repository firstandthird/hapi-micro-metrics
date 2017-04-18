const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server({
  debug: {
    log: ['micro-metrics']
  }
});
server.connection({ 
  host: 'localhost', 
  port: 8000 
});

server.register({
  register: require('../'),
  options: {
    host: process.env.METRICS_HOST,
    verbose: true
  }
});

// Add the route
server.route({
  method: 'GET',
  path:'/track', 
  handler: function (request, reply) {
    request.server.track('test', 1, { tag: '123'}, { name: 'bob' });
    reply('ok');
  }
});

// Start the server
server.start((err) => {

  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
