'use strict';
const wreck = require('wreck');
const url = require('url');
exports.register = function(server, options, next) {
  const debounce = options.debounce || 1000 * 5; //default to every 5 seconds
  const batchEvery = options.batchEvery || 20;

  let timeout = null;
  let cache = [];

  const send = (done) => {
    if (!done) {
      done = function() {};
    }
    if (cache.length === 0) {
      return done();
    }
    const payload = {
      events: cache.slice(0)
    };
    cache = [];
    wreck.post(url.resolve(options.host, 'api/track/batch'), {
      json: true,
      payload: JSON.stringify(payload)
    }, (err, resp, data) => {
      if (err) {
        server.log(['micro-metrics', 'error'], { err, data, payload });
        cache = cache.concat(payload.events);
        return done(err);
      }
      if (options.verbose) {
        server.log(['micro-metrics', 'track', 'batch'], { count: data.length });
      }
      done();
    });
  };

  server.decorate('server', 'track', (type, value, tags, data) => {
    if (options.verbose || !options.host) {
      server.log(['micro-metrics', 'track'], { type, tags, value, data });
    }
    if (!options.host) {
      return;
    }
    cache.push({ type, value, tags, data, createdOn: new Date() });
    if (timeout && cache.length !== batchEvery) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(send, debounce);
  });

  server.ext('onPreStop', (s, done) => {
    send(done);
  });

  const excluded = (tags, excludedTags) => {
    if (excludedTags === undefined) {
      return false;
    }
    for (let i = 0; i < excludedTags.length; i++) {
      for (let j = 0; j < tags.length; j++) {
        if (tags[j] === excludedTags[i]) {
          return true;
        }
      }
    }
    return false;
  };
  if (options.logTrack) {
    server.on('log', (event, tags) => {
      const tagList = Object.keys(tags);
      tagList.forEach((tag) => {
        options.logTrack.forEach((logTrack) => {
          if (tag === logTrack.logTag && !excluded(tagList, logTrack.exclude)) {
            server.track(logTrack.metricType, logTrack.value || 1, logTrack.metricTags || {}, {});
          }
        });
      });
    });
  }
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
