# hapi-micro-metrics

A [hapi](https://hapi.dev/) plugin to manage reporting metrics from a local server to a [micro-metrics](https://github.com/firstandthird/micro-metrics) metrics-tracking server.

[micro-metrics](https://github.com/firstandthird/micro-metrics) is a self-contained microservice implemented in docker that you use to store metrics from one or more independent servers. This plugin just automates reporting metrics to your micro-metrics instance.

## Installation

```
npm install hapi-micro-metrics
```

## Basic Usage

Just register the plugin like normal and give it the URL of your micro-metrics server, then start making calls to track a metric:

```js
await server.register({
  plugin: require('hapi-micro-metrics'),
  options: {
    host: 'http://my-metrics.org'
  }
});
await server.start();
server.track('number-of-logins', 132, { login-method: 'HTTP' }, { loginTypes: { user: 100, admin: 32 } });
```

## Track Parameters
The _server.track_ method is the main way you interface with hapi-micro-metrics.  The parameters are:

```
_server.track(<metric-name>, <metric-value>, <tags>, <data>);
```

where:

- _metric-name_

  is a string indicating the name of the metric you want to track

- _metric-value_

  is the value of the metric at the time that _track_ is called

- _tags_

  a string, array of strings, or object (where the keys are the tags).  These are metric tags that can be used to search for metrics in a micro-metrics instance.

- _data_

  an object containing any additional data you want to store with your data

## Tracking By Log

Another way to use hapi-micro-metrics is _log tracking_.  This means that you specify one or more hapi [log tags](https://hapi.dev/api/?v=20.1.0#-serverlogtags-data-timestamp) and hapi-micro-metrics will invoke _server.track_ every time a call to _server.log()_ is made containing one or more of those tags.  For example:

```js
await server.register({
  plugin: require('hapi-micro-metrics'),
  options: {
    host: 'http://localhost:8080',
    logTrack: [{
      metricType: 'requests-per-minute',
      value: 1,
      metricTags: 'RPM',
      logTag: 'tag1',
      excludedTags: ['exclude1']
    }]
  }
});
```

Now every time you call:
```js
server.log(['tag1'], { hello: 'world!' });
```

hapi-micro-metrics will execute:
```js
server.track('requests-per-minute', 1, 'RPM', { hello: 'world!' });
```

But calling
```js
server.log(['tag1', 'exclude1'], { hello: 'world!' });
```

will have no effect, since the 'exclude1' tag was listed in the _excludedTags_ field.

## Plugin Options

- _host_ (required)

  URL for the micro-metrics host, this is where your metrics will be sent

- _verbose_

  When true, hapi-micro-metrics will also locally log all the tracked metrics as they are made

- _debounce_

  Maximum rate at which tracks will be posted to micro-metrics. So if _debounce_ is set to 10 seconds and you call _server.track()_ every second over a 20 second period, it will still only actually execute the first call and the tenth call.  Default rate limit is 5 seconds.

- _logTrack_

    A list of one or more log tracking directives.  These should be object with the form:

  - _metricType_

    The name of the metric _type_

  - _value_

    The value of the metric

  - _metricTags_

    The tags for the metric, these are the tags that are passed to the micro-metrics server.  Can be passed as either a string or an array of strings.

  - _logTag_

    The hapi log tag that will trigger the call to _server.track()_.  This is just the tag used to identify that a call to track needs to be made and is not passed to micro-metrics.  

  - _excludedTags_

    A list of excluded tags, hapi-micro-metrics will ignore a call to _server.log()_ that includes any one of these tags.
