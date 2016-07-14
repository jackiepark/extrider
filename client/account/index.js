'use strict';

const angular = require('angular');
const AccountController = require('./controllers/account');
const ProviderController = require('./controllers/provider');
const JobController = require('./controllers/job');
const interpolate = require('../utils/interpolate');

const app = angular.module('account', ['alerts'])
  .config(['$interpolateProvider', interpolate])
  .controller('AccountController', ['$scope', '$sce', AccountController])
  .controller('Account.ProviderController', ['$scope', '$element', '$attrs', ProviderController])
  .controller('Account.JobController', ['$scope', '$element', '$attrs', JobController]);

module.exports = app;
