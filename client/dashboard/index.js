'use strict';

const angular = require('angular');
const interpolate = require('../utils/interpolate');
const DashboardController = require('./controllers/dashboard');

const app = angular.module('dashboard', ['moment'])
  .config(['$interpolateProvider', interpolate])
  .controller('Dashboard', ['$scope', '$element', DashboardController]);

module.exports = app;
