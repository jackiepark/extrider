'use strict';

const angular = require('angular');
const ansi = require('./filters/ansi');

const app = angular.module('ansi', [])
  .filter('ansi', ansi);
