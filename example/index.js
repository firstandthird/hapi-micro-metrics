const Hapi = require('hapi');

const f = async () => {
  // Create a server with a host and port
  const server = new Hapi.Server({
    host: 'localhost',
    port: 8000,
    debug: {
      log: ['micro-metrics']
    }
  });

  await server.register({
    plugin: require('../'),
    options: {
      host: process.env.METRICS_HOST,
      verbose: true,
      batchEvery: 2,
      logTrack: [
        // will track any log containing the 'error' tag with the specified metric tags and value:
        { logTag: 'error', metricType: 'server.error', metricTags: {}, value: 1 },
        // will track any log containing the 'example' tag with default metric tags and value:
        { logTag: 'example', metricType: 'examples' },
        // will track any log containing the 'example' tag but not the 'current' tag:
        { logTag: 'example', exclude: ['current'], metricType: 'should not store this', value: 'should not be stored!' },
        { logTag: 'start', metricType: 'server.start' }
      ]
    }
  });

  // Add the route
  server.route({
    method: 'GET',
    path: '/track',
    handler(request, h) {
      request.server.track('test', 1, { tag: '123' }, { name: 'bob' });
      return 'ok';
    }
  });

  // Add a route to demonstrate log-tracking:
  server.route({
    method: 'GET',
    path: '/log-track',
    handler(request, h) {
      request.server.log(['example', 'current'], 'this is an example');
      return 'ok';
    }
  });

  // Start the server
  await server.start();
  server.log(['start'], `Server running at: ${server.info.uri}`);
  process.on('SIGTERM', async() => {
    await server.stop();
    process.exit(0);
  });
};
f();
