'use strict';

import angular from 'angular' ;

import PluginController from './controllers/plugin' ;
import PluginTableController from './controllers/plugin-table' ;
import interpolate from '../utils/interpolate' ;

const app = angular.module('plugin-manager', [])
  .config(['$interpolateProvider', interpolate])
  .controller('PluginController', ['$http', '$timeout', PluginController])
  .controller('PluginTableController', ['$scope', PluginTableController]);

export default app;
