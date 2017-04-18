'use strict';
const wreck = require('wreck');
const url = require('url');
exports.register = function(server, options, next) {

  console.log(options);
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
        sever.log(['micro-metrics', 'error'], err);
        return;
      }
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, fields });
      }
    });
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
