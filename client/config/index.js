'use strict';

import angular from 'angular';
import RunnerController from './controllers/runner';
import ProviderController from './controllers/provider';
import JobController from './controllers/job';
import ConfigController from './controllers/config';
import BranchesController from './controllers/branches';
import CollaboratorsController from './controllers/collaborators';
import DeactivateController from './controllers/deactivate';
import HerokuController from './controllers/heroku';
import GithubController from './controllers/github';
import interpolate from '../utils/interpolate';
import ngSortableDirective from '../utils/ng-sortable-directive';

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

export default app;
