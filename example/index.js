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
    verbose: true,
    logTrack: [
      // will track any log containing the 'error' tag with the specified metric tags and value:
      { logTag: 'error', metricType: 'server.error', metricTags: {}, value: 1 },
      // will track any log containing the 'example' tag with default metric tags and value:
      { logTag: 'example', metricType: 'examples' },
      // will track any log containing the 'example' tag but not the 'current' tag:
      { logTag: 'example', exclude: ['current'], metricType: 'should not store this', value: 'should not be stored!' }
    ]
  }
});

// Add the route
server.route({
  method: 'GET',
  path: '/track',
  handler(request, reply) {
    request.server.track('test', 1, { tag: '123' }, { name: 'bob' });
    reply('ok');
  }
});

// Add a route to demonstrate log-tracking:
server.route({
  method: 'GET',
  path: '/log-track',
  handler(request, reply) {
    request.server.log(['example', 'current'], 'this is an example');
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
