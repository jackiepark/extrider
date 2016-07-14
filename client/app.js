'use strict';
require('./styles/strider.less');
const $ = require('jquery');
const _ = require('lodash');
const angular = require('angular');
const ngRoute = require('angular-route');
const $navbar = $('.navbar');

$navbar.find('li').removeClass('active');
$navbar.find('a[href="' + global.location.pathname + '"]')
  .parent().addClass('active');
$('#layout-header').hide();
$('#invite-box').height($('#signup-box').height());

// Third party
require('angular-ui-bootstrap');
require('angular-ui-codemirror');

// Modules
require('./account');
require('./config');
require('./plugin-manager');
require('./job-status');
require('./dashboard');
require('./projects');

// Shared?
require('./alerts');
require('./ansi');
require('./moment');

const app = angular.module('app', [
  'config',
  'account',
  'plugin-manager',
  'job-status',
  'dashboard',
  'projects'
]);

// For access from plugins, need a better way
global.app = app;
global.$ = $;
global.angular = angular;
global._ = _;
