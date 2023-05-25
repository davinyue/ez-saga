'use strict'
const base = require('./base');
const dev = require('./dev.env');
const test = require('./test.env');
const prod = require('./prod.env');
const APP_ENV = process.env.APP_ENV;
const config = {
  dev: dev,
  test: test,
  prod: prod
}
let currentConfig = config[APP_ENV];
currentConfig = Object.assign(base, currentConfig);
currentConfig.env = APP_ENV;
module.exports = currentConfig;