'use strict';
const wreck = require('wreck');
const url = require('url');
exports.register = function(server, options, next) {
  server.decorate('server', 'track', (type, value, tags, fields) => {
    if (!options.host) {
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, fields });
      }
      return;
    }
    wreck.post(url.resolve(options.host, '/api/track'), {
      json: true,
      payload: JSON.stringify({
        type,
        tags,
        value,
        fields
      })
    }, (err, resp, payload) => {
      if (err) {
        server.log(['micro-metrics', 'error'], err);
        return;
      }
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, fields });
      }
    });
  });
  if (options.logTrack) {
    server.on('log', (event, tags) => {
      options.logTrack.forEach((logTrack) => {
        Object.keys(tags).forEach((tag) => {
          if (tag === logTrack.logTag) {
            server.track(logTrack.metricType, logTrack.value, logTrack.metricTags, {});
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
