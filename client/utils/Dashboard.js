import JobMonitor from './JobMonitor' ;

// Events we care about:
// - job.new (job, access)
// - job.done (job, access)
// - browser.update (event, args, access)
export default class Dashboard extends JobMonitor {
  constructor(socket, $scope) {
    super(socket, $scope.$digest.bind($scope));
    this.scope = $scope;
    this.scope.loadingJobs = false;
    this.scope.jobs = global.jobs;
  }

  job(id, access) {
    const jobs = this.scope.jobs[access];
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i]._id === id) return jobs[i];
    }
  }

  addJob(job, access) {
    let jobs = this.scope.jobs[access]
      , found = -1
      , old;
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].project.name === job.project.name) {
        found = i;
        break;
      }
    }
    if (found !== -1) {
      old = jobs.splice(found, 1)[0];
      job.project.prev = old.project.prev;
    }
    if (job.phases) {
      // get rid of extra data - we don't need it.
      // note: this won't be passed up anyway for public projects
      this.cleanJob(job);
    }
    job.phase = 'environment';
    jobs.unshift(job);
  }

  cleanJob(job) {
    delete job.phases;
    delete job.std;
    delete job.stdout;
    delete job.stderr;
    delete job.stdmerged;
    delete job.plugin_data;
  }
}

Dashboard.prototype.statuses['phase.done'] = function (data) {
  this.phase = data.next;
};
