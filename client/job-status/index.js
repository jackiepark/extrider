// TODO: go through this comment
/* globals bootbox: true, io: true, SKELS: true, job: true */
'use strict';

const angular = require('angular');
const routes = require('./configs/routes.js');
const pluginStatus = require('./directives/plugin-status');
const JobController = require('./controllers/job');
const interpolate = require('../utils/interpolate');

const app = angular.module('job-status', ['moment', 'ansi', 'ngRoute'])
  .config(['$interpolateProvider', interpolate])
  .config(['$locationProvider', '$routeProvider', routes])
  .controller('JobCtrl', ['$scope', '$route', '$location', '$filter', JobController])
  .directive('pluginStatus', pluginStatus);

module.exports = app;
