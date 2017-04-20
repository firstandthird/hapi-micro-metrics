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
    const payload = {
      type,
      tags,
      fields
    };
    if (value) {
      payload.value = value;
    }
    wreck.post(url.resolve(options.host, '/api/track'), {
      json: true,
      payload: JSON.stringify(payload)
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
