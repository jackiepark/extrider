'use strict';

const angular = require('angular');
const AlertsController = require('./controllers/alerts');

const app = angular.module('alerts', [])
  .controller('AlertsController', ['$scope', '$sce', AlertsController]);

module.exports = app;
