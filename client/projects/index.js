'use strict';

import angular from 'angular' ;
import interpolate from '../utils/interpolate' ;
import ManualController from './controllers/manual' ;
import ProjectsController from './controllers/projects' ;

const app = angular.module('projects', ['alerts', 'moment', 'ui.bootstrap.buttons'])
  .config(['$interpolateProvider', interpolate])
  .controller('ManualController', ['$scope', '$attrs', ManualController])
  .controller('ProjectsController', ['$scope', ProjectsController]);

export default app;
