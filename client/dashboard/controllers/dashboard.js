// TODO: cleanup comments
/* global JobMonitor: true, io: true */
'use strict';

import $ from 'jquery';
import io from 'socket.io-client';
import JobMonitor from '../../utils/job-monitor';
import statusClasses from '../../utils/status-classes';

// Events we care about:
// - job.new (job, access)
// - job.done (job, access)
// - browser.update (event, args, access)
class Dashboard extends JobMonitor {
  constructor(socket, $scope) {
    super(socket, $scope.$digest.bind($scope));
    this.scope = $scope;
    this.scope.loadingJobs = false;
    this.scope.jobs = global.jobs;
    this.statuses['phase.done'] = data => {
      this.phase = data.next;
    };
  }

  job(id, access) {
    const jobs = this.scope.jobs[access];
    return jobs.find(job => job._id === id);
  }

  addJob(job, access) {
    let jobs = this.scope.jobs[access],
      found = jobs.findIndex(each => each.project.name === job.project.name),
      old;
    if (found !== -1) {
      old = jobs.splice(found, 1)[0];
      job.project.prev = old.project.prev;
    }
    if (job.phases) {
      // get rid of extra data - we don't need it.
      // note: this won't be passed up anyway for public projects
      cleanJob(job);
    }
    job.phase = 'environment';
    jobs.unshift(job);
  }
}

export default function DashboardController($scope, $element) {
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
function determineTargetBranch(job){
  return job.ref ? job.ref.branch : 'master';
}

function cleanJob(job) {
  delete job.phases;
  delete job.std;
  delete job.stdout;
  delete job.stderr;
  delete job.stdmerged;
  delete job.plugin_data;
}
