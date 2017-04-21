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
    }, (err, resp) => {
      if (err) {
        server.log(['micro-metrics', 'error'], err);
        return;
      }
      if (options.verbose) {
        server.log(['micro-metrics', 'track'], { type, tags, value, fields });
      }
    });
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
