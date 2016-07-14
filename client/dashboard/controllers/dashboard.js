// TODO: cleanup comments
/* global JobMonitor: true, io: true */
'use strict';

import $ from 'jquery' ;
import io from 'socket.io-client' ;
import Dashboard from '../../utils/Dashboard';
import statusClasses from '../../utils/status-classes' ;

export default function ($scope, $element) {
  const socket = io.connect();
  const dash = new Dashboard(socket, $scope);

  $scope.statusClasses = statusClasses;
  $scope.providers = global.providers;
  $scope.phases = ['environment', 'prepare', 'test', 'deploy', 'cleanup'];
  $('#dashboard').show();
  $scope.startDeploy = function (job) {
    $('.tooltip').hide();
    const branchToUse = determineTargetBranch(job);
    socket.emit('deploy', job.project.name, branchToUse);
  };
  $scope.startTest = function (job) {
    $('.tooltip').hide();
    const branchToUse = determineTargetBranch(job);
    socket.emit('test', job.project.name, branchToUse);
  };
  $scope.cancelJob = function (id) {
    socket.emit('cancel', id);
  };
};

/**
 * Given a job, returns a branch name that should be used for a deployment or test action.
 * @param {Object} job The job for which to determine the target branch.
 * @returns {String} If a reference build is defined, returns the name of the branch of the reference build; "master" otherwise.
 */
function determineTargetBranch(job) {
  return job.ref ? job.ref.branch : 'master';
}
