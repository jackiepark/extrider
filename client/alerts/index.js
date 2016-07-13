'use strict';

import angular from 'angular';
import AlertsController from './controllers/alerts';

export default angular.module('alerts', [])
  .controller('AlertsController', ['$scope', '$sce', AlertsController]);
