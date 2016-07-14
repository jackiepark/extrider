'use strict';

const angular = require('angular');
const interpolate = require('../utils/interpolate');
const ManualController = require('./controllers/manual');
const ProjectsController = require('./controllers/projects');

const app = angular.module('projects', ['alerts', 'moment', 'ui.bootstrap.buttons'])
  .config(['$interpolateProvider', interpolate])
  .controller('ManualController', ['$scope', '$attrs', ManualController])
  .controller('ProjectsController', ['$scope', ProjectsController]);

module.exports = app;
