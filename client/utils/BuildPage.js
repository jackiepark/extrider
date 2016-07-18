import JobMonitor from './JobMonitor' ;
import PHASES from './phases' ;
import SKELS from './skels' ;

export default class BuildPage extends JobMonitor {
  constructor(socket, project, change, scope, jobs, job) {
    super(socket, change);
    this.scope = scope;
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
    let found = -1
      , i;
    for (i = 0; i < this.scope.jobs.length; i++) {
      if (this.scope.jobs[i]._id === job._id) {
        found = i;
        break;
      }
    }
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
      for (i = 0; i < PHASES.length; i++) {
        job.phases[PHASES[i]] = _.cloneDeep(SKELS.phase);
      }
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
    this.socket.emit('build:job', id, function (job) {
      self.jobs[id] = job;
      done(null, job);
    });
  }
}

function ensureCommand(phase) {
  let command = phase.commands[phase.commands.length - 1];
  if (!command || typeof(command.finished) !== 'undefined') {
    command = { ...SKELS.command };
    phase.commands.push(command);
  }
  return command;
}

BuildPage.prototype.statuses = {
  ...JobMonitor.prototype.statuses,
  'phase.done'(data) {
    this.phases[data.phase].finished = data.time;
    this.phases[data.phase].duration = data.elapsed;
    this.phases[data.phase].exitCode = data.code;
    if (['prepare', 'environment', 'cleanup'].indexOf(data.phase) !== -1) {
      this.phases[data.phase].collapsed = true;
    }
    if (data.phase === 'test') this.test_status = data.code;
    if (data.phase === 'deploy') this.deploy_status = data.code;
    if (!data.next || !this.phases[data.next]) return;
    this.phase = data.next;
    this.phases[data.next].started = data.time;
  },
  'command.comment'(data) {
    const phase = this.phases[this.phase]
      , command = { ...SKELS.command };
    command.command = data.comment;
    command.comment = true;
    command.plugin = data.plugin;
    command.finished = data.time;
    phase.commands.push(command);
  },
  'command.start'(data) {
    const phase = this.phases[this.phase]
      , command = { ...SKELS.command, ...data };
    command.started = data.time;
    phase.commands.push(command);
  },
  'command.done'(data) {
    const phase = this.phases[this.phase]
      , command = phase.commands[phase.commands.length - 1];
    command.finished = data.time;
    command.duration = data.elapsed;
    command.exitCode = data.exitCode;
    command.merged = command._merged;
  },
  'stdout'(text) {
    const command = ensureCommand(this.phases[this.phase]);
    command.out += text;
    command._merged += text;
    this.std.out += text;
    this.std.merged += text;
    this.std.merged_latest = text;
  },
  'stderr'(text) {
    const command = ensureCommand(this.phases[this.phase]);
    command.err += text;
    command._merged += text;
    this.std.err += text;
    this.std.merged += text;
    this.std.merged_latest = text;
  }
};
