import JobMonitor from './job-monitor';
import JobDataStatus from './job-data-status';
import PHASES from './phases';
import SKELS from './skels';

export default class BuildPage extends JobMonitor {
  constructor(socket, project, change, scope, jobs, job) {
    super(socket, change);
    this.scope = scope;
    this.statuses = new JobDataStatus();
    this.project = project;
    this.jobs = jobs;
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
