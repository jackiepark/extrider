'use strict';

import $ from 'jquery' ;
import angular from 'angular' ;
import time from './directives/time' ;
import toggle from './directives/toggle' ;
import rawHtml from './directives/raw-html' ;
import percentage from './filters/percentage' ;

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

export default app;
