'use strict';

import angular from 'angular';
import AccountController from './controllers/account';
import ProviderController from './controllers/provider';
import JobController from './controllers/job';
import interpolate from '../utils/interpolate';

export default angular.module('account', ['alerts'])
  .config(['$interpolateProvider', interpolate])
  .controller('AccountController', ['$scope', '$sce', AccountController])
  .controller('Account.ProviderController', ['$scope', '$element', '$attrs', ProviderController])
  .controller('Account.JobController', ['$scope', '$element', '$attrs', JobController]);
