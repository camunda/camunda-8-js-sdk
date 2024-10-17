// config-overrides.js
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
  };

  config.plugins = (config.plugins || []).concat([
    new NodePolyfillPlugin()
  ]);

  return config;
};
