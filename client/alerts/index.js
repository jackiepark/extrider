'use strict';

import angular from 'angular' ;
import AlertsController from './controllers/alerts' ;

const app = angular.module('alerts', [])
  .controller('AlertsController', ['$scope', '$sce', AlertsController]);

export default app;
