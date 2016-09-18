'use strict';
const wreck = require('wreck');
const url = require('url');
exports.register = function(server, options, next) {

  server.decorate('server', 'track', (type, tags, value, data) => {
    if (!options.endpoint) {
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, data });
      }
      return;
    }
    wreck.post(url.resolve(options.endpoint, '/api/track'), {
      json: true,
      payload: JSON.stringify({
        type,
        tags,
        value,
        data
      })
    }, (err, resp, payload) => {
      if (err) {
        sever.log(['micro-metrics', 'error'], err);
        return;
      }

      if (resp.statusCode !== 200) {
        sever.log(['micro-metrics', 'error'], new Error(`Metrics API returned status code of ${resp.statusCode}`));
        return;
      }
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, data });
      }
    });
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
