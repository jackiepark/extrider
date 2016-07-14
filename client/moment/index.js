'use strict';

const $ = require('jquery');
const angular = require('angular');
const time = require('./directives/time');
const toggle = require('./directives/toggle');
const rawHtml = require('./directives/raw-html');
const percentage = require('./filters/percentage');

require('timeago');

// instead of "about %d hours"
$.timeago.settings.strings.hour = 'an hour';
$.timeago.settings.strings.hours = '%d hours';
$.timeago.settings.localeTitle = true;

const app = angular.module('moment', [])
  .directive('time', time)
  .directive('toggle', toggle)
  .directive('rawHtml', rawHtml)
  .filter('percentage', percentage);

module.exports = app;
