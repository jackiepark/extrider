'use strict';

import angular from 'angular' ;
import ansi from './filters/ansi' ;

const app = angular.module('ansi', [])
  .filter('ansi', ansi);
