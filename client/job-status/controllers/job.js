'use strict';

import _ from 'lodash';
import bootbox from 'bootbox';
import $ from 'jquery';
import io from 'socket.io-client';
import JobDataMonitor from '../../utils/job-data-monitor';
import PHASES from '../../utils/phases';
import SKELS from '../../utils/skels';
import statusClasses from '../../utils/status-classes';

let outputConsole;
let runtime = null;

const job = global.job;
const project = global.project;

class BuildPage extends JobDataMonitor {
  constructor(socket, project, change, scope, jobs, job) {
    super(socket, change);
    this.scope = scope;
    this.project = project;
    this.jobs = {};
    this.jobs[job._id] = job;
  }

  emits = {
    getUnknown: 'build:job'
  };

  job(id, access) {
    return this.jobs[id];
  }

  addJob(job, access) {
    if ((job.project.name || job.project) !== this.project) return;
    this.jobs[job._id] = job;
    const found = this.scope.jobs.findIndex(each => each === job._id);
    if (found !== -1) {
      this.scope.jobs.splice(found, 1);
    }
    if (!job.phase) job.phase = 'environment';
    if (!job.std) {
      job.std = {
        out: '',
        err: '',
        merged: ''
      };
    }
    if (!job.phases) {
      job.phases = {};
      PHASES.forEach(PHASE => {
        job.phases[PHASE] = { ...SKELS.phase };
      });
      job.phases[job.phase].started = new Date();
    } else {
      if (job.phases.test.commands.length) {
        if (job.phases.environment) {
          job.phases.environment.collapsed = true;
        }
        if (job.phases.prepare) {
          job.phases.prepare.collapsed = true;
        }
        if (job.phases.cleanup) {
          job.phases.cleanup.collapsed = true;
        }
      }
    }

    this.scope.jobs.unshift(job);
    this.scope.job = job;
  }

  get(id, done) {
    if (this.jobs[id]) {
      done(null, this.jobs[id], true);
      return true;
    }
    const self = this;
    this.sock.emit('build:job', id, function (job) {
      self.jobs[id] = job;
      done(null, job);
    });
  }
}

export default function JobController($scope, $route, $location, $filter) {
  let params = $route.current ? $route.current.params : {};
  let jobid = params.id || (global.job && global.job._id);
  const socket = io.connect();
  const lastRoute = $route.current;
  const jobman = new BuildPage(socket, project.name, $scope.$digest.bind($scope), $scope, global.jobs, global.job);

  outputConsole = global.document.querySelector('.console-output');

  $scope.statusClasses = statusClasses;
  $scope.phases = ['environment', 'prepare', 'test', 'deploy', 'cleanup'];
  $scope.project = project;
  $scope.jobs = global.jobs;
  $scope.job = global.job;
  $scope.canAdminProject = global.canAdminProject;
  $scope.showStatus = global.showStatus;

  if ($scope.job && $scope.job.phases.test.commands.length) {
    if (job.phases.environment) {
      job.phases.environment.collapsed = true;
    }
    if (job.phases.prepare) {
      job.phases.prepare.collapsed = true;
    }
    if (job.phases.cleanup) {
      job.phases.cleanup.collapsed = true;
    }
  }

  $scope.toggleErrorDetails = function () {
    $scope.showErrorDetails = !$scope.showErrorDetails;
  };

  $scope.clearCache = function () {
    $scope.clearingCache = true;
    $.ajax('/' + $scope.project.name + '/cache/' + $scope.job.ref.branch, {
      type: 'DELETE',
      success: function () {
        $scope.clearingCache = false;
        $scope.$digest();
      },
      error: function () {
        $scope.clearingCache = false;
        $scope.$digest();
        bootbox.alert('Failed to clear the cache');
      }
    });
  };

  $scope.$on('$locationChangeSuccess', function (event) {
    if (global.location.pathname.match(/\/config$/)) {
      global.location = global.location;
      return;
    }
    params = $route.current.params;
    if (!params.id) params.id = $scope.jobs[0]._id;
    // don't refresh the page
    $route.current = lastRoute;
    if (jobid !== params.id) {
      jobid = params.id;
      const cached = jobman.get(jobid, function (err, job, cached) {
        if (job.phases.environment) {
          job.phases.environment.collapsed = true;
        }
        if (job.phases.prepare) {
          job.phases.prepare.collapsed = true;
        }
        if (job.phases.cleanup) {
          job.phases.cleanup.collapsed = true;
        }
        $scope.job = job;
        if ($scope.job.phases.test.commands.length) {
          $scope.job.phases.environment.collapsed = true;
          $scope.job.phases.prepare.collapsed = true;
          $scope.job.phases.cleanup.collapsed = true;
        }
        if (!cached) $scope.$digest();
      });
      if (!cached) {
        $scope.job = $scope.jobs.find(job => job._id === jobid);
      }
    }
  });

  $scope.triggers = {
    commit: {
      icon: 'code-fork',
      title: 'Commit'
    },
    manual: {
      icon: 'hand-o-right',
      title: 'Manual'
    },
    plugin: {
      icon: 'puzzle-piece',
      title: 'Plugin'
    },
    api: {
      icon: 'cloud',
      title: 'Cloud'
    }
  };

  // shared templates ; need to know what to show
  $scope.page = 'build';
  // a history item is clicked
  $scope.selectJob = function (id) {
    $location.path('/job/' + id).replace();
  };

  // set the favicon according to job status
  $scope.$watch('job.status', function (value) {
    updateFavicon(value);
  });

  buildSwitcher($scope);

  $scope.$watch('job.std.merged_latest', function (value) {
    /* Tracking isn't quite working right
     if ($scope.job.status === 'running') {
     height = outputConsole.getBoundingClientRect().height;
     tracking = height + outputConsole.scrollTop > outputConsole.scrollHeight - 50;
     // console.log(tracking, height, outputConsole.scrollTop, outputConsole.scrollHeight);
     if (!tracking) return;
     }
     */
    const ansiFilter = $filter('ansi');
    $('.job-output').last().append(ansiFilter(value));
    outputConsole.scrollTop = outputConsole.scrollHeight;
    setTimeout(function () {
      outputConsole.scrollTop = outputConsole.scrollHeight;
    }, 10);
  });
  // button handlers
  $scope.startDeploy = function (job) {
    $('.tooltip').hide();
    socket.emit('deploy', project.name, job && job.ref.branch);
    $scope.job = {
      project: $scope.job.project,
      status: 'submitted'
    };
  };
  $scope.startTest = function (job) {
    $('.tooltip').hide();
    socket.emit('test', project.name, job && job.ref.branch);
    $scope.job = {
      project: $scope.job.project,
      status: 'submitted'
    };
  };
  $scope.restartJob = function (job) {
    socket.emit('restart', job);
  };
  $scope.cancelJob = function (id) {
    socket.emit('cancel', id);
  };
};

/** manage the favicons **/
function setFavicon(status) {
  $('link[rel*="icon"]').attr('href', '/images/icons/favicon-' + status + '.png');
}

function animateFav() {
  let alt = false;

  function switchit() {
    setFavicon('running' + (alt ? '-alt' : ''));
    alt = !alt;
  }

  return setInterval(switchit, 500);
}

function updateFavicon(value) {
  if (value === 'running') {
    if (runtime === null) {
      runtime = animateFav();
    }
  } else {
    if (runtime !== null) {
      clearInterval(runtime);
      runtime = null;
    }
    setFavicon(value);
  }
}

function buildSwitcher($scope) {
  function switchBuilds(evt) {
    let dy = { 40: 1, 38: -1 }[evt.keyCode]
      , id = $scope.job._id
      , idx = $scope.jobs.findIndex(job => job._id === id);
    if (!dy) return;
    if (idx === -1) {
      console.log('Failed to find job.');
      return global.location = global.location;
    }
    idx += dy;
    if (idx < 0 || idx >= $scope.jobs.length) {
      return;
    }
    evt.preventDefault();
    $scope.selectJob($scope.jobs[idx]._id);
    $scope.$root.$digest();
  }

  global.document.addEventListener('keydown', switchBuilds);
}
