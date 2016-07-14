'use strict';

import angular from 'angular' ;
import interpolate from '../utils/interpolate' ;
import DashboardController from './controllers/dashboard' ;

const app = angular.module('dashboard', ['moment'])
  .config(['$interpolateProvider', interpolate])
  .controller('Dashboard', ['$scope', '$element', DashboardController]);

export default app;
