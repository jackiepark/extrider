'use strict';

const angular = require('angular');

const PluginController = require('./controllers/plugin');
const PluginTableController = require('./controllers/plugin-table');
const interpolate = require('../utils/interpolate');

const app = angular.module('plugin-manager', [])
  .config(['$interpolateProvider', interpolate])
  .controller('PluginController', ['$http', '$timeout', PluginController])
  .controller('PluginTableController', ['$scope', PluginTableController]);

module.exports = app;
