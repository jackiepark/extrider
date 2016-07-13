// TODO: go through this comment
/* globals bootbox: true, io: true, SKELS: true, job: true */
'use strict';

import angular from 'angular';
import routes from './configs/routes.js';
import pluginStatus from './directives/plugin-status';
import JobController from './controllers/job';
import interpolate from '../utils/interpolate';

const app = angular.module('job-status', ['moment', 'ansi', 'ngRoute'])
  .config(['$interpolateProvider', interpolate])
  .config(['$locationProvider', '$routeProvider', routes])
  .controller('JobCtrl', ['$scope', '$route', '$location', '$filter', JobController])
  .directive('pluginStatus', pluginStatus);

export default app;
