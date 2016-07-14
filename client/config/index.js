'use strict';

const angular = require('angular');
const RunnerController = require('./controllers/runner');
const ProviderController = require('./controllers/provider');
const JobController = require('./controllers/job');
const ConfigController = require('./controllers/config');
const BranchesController = require('./controllers/branches');
const CollaboratorsController = require('./controllers/collaborators');
const DeactivateController = require('./controllers/deactivate');
const HerokuController = require('./controllers/heroku');
const GithubController = require('./controllers/github');
const interpolate = require('../utils/interpolate');
const ngSortableDirective = require('../utils/ng-sortable-directive');

const app = angular.module('config', ['ui.bootstrap', 'ui.codemirror', 'alerts', 'moment'])
  .config(['$interpolateProvider', interpolate])
  .controller('Config', ['$scope', '$element', '$sce', ConfigController])
  .controller('Config.RunnerController', ['$scope', '$element', RunnerController])
  .controller('Config.ProviderController', ['$scope', ProviderController])
  .controller('Config.JobController', ['$scope', '$element', JobController])
  .controller('BranchesCtrl', ['$scope', BranchesController])
  .controller('CollaboratorsCtrl', ['$scope', CollaboratorsController])
  .controller('DeactivateCtrl', ['$scope', DeactivateController])
  .controller('HerokuController', ['$scope', HerokuController])
  .controller('GithubCtrl', ['$scope', GithubController])
  .directive('ngSortable', ['$parse', ngSortableDirective])
  .directive('repeatEnd', function () {
    return function (scope, element, attrs) {
      if (scope.$last && scope.$parent.finishedRepeat) {
        scope.$parent.finishedRepeat(attrs);
      }
    };
  });

module.exports = app;
