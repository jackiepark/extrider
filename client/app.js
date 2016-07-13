'use strict';
import './styles/strider.less';
import $ from 'jquery';
import _ from 'lodash';
import angular from 'angular';
import 'angular-route';
// Third party
import 'angular-ui-bootstrap';
import 'angular-ui-codemirror';

// Modules
import './account';
import './config';
import './plugin-manager';
import './job-status';
import './dashboard';
import './projects';

// Shared?
import './alerts';
import './ansi';
import './moment';

const $navbar = $('.navbar');
$navbar.find('li').removeClass('active');
$navbar.find('a[href="' + global.location.pathname + '"]').parent().addClass('active');
$('#layout-header').hide();
$('#invite-box').height($('#signup-box').height());

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
