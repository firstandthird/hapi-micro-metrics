const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index.js');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

tap.test('server.track', async (t) => {
  const server = new Hapi.Server({
    debug: {
      log: ['micro-metrics']
    },
    port: 8080
  });
  await server.register({
    plugin,
    options: {
      host: 'http://localhost:8080'
    }
  });
  server.route({
    path: '/api/track/batch',
    method: 'post',
    handler(request, h) {
      t.equal(request.payload.events.length, 1);
      const event = request.payload.events[0];
      t.equal(event.type, 'type', 'sends type to host');
      t.equal(event.value, 'value', 'sends value to host');
      t.equal(event.tags.length, 2, 'sends tags to host');
      t.equal(event.data.datum, 1, 'sends data to host');
      return [1, 2, 3];
    }
  });
  await server.start();
  t.equal(typeof server.track, 'function', 'decorates server with track method');
  server.track('type', 'value', ['tag1', 'tag2'], { datum: 1 });
  await server.stop();
  t.end();
});

tap.test('logTrack will track log statements with specified tags', async (t) => {
  t.plan(4);
  const server = new Hapi.Server({
    debug: {
      log: ['micro-metrics']
    },
    port: 8080
  });
  await server.register({
    plugin,
    options: {
      host: 'http://localhost:8080',
      logTrack: [{
        metricType: 'metricType',
        value: 'metricValue',
        metricTags: 'metric-tag',
        logTag: 'tag1',
        excludedTags: ['exclude1']
      }]
    }
  });
  server.route({
    path: '/api/track/batch',
    method: 'post',
    handler(request, h) {
      t.equal(request.payload.events.length, 2);
      const event = request.payload.events[0];
      t.equal(event.type, 'metricType', 'sends metric type to host');
      t.equal(event.value, 'metricValue', 'sends metric value to host');
      t.equal(event.tags, 'metric-tag', 'sends metric tag to host');
      return [1, 2, 3];
    }
  });
  await server.start();
  server.log(['tag1'], { datum: 1 });
  await wait(2000);
  server.log(['tag1', 'exclude1'], { datum: 1 }); // should not track excluded tags
  await wait(2000);
  await server.stop();
  t.end();
});
