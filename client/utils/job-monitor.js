import JobStatus from './job-status';
// The Job Monitor:
// - update jobs based on browser events
//

export default class JobMonitor {
  constructor(socket, changed) {
    this.sock = socket;
    this.changed = changed;
    this.waiting = {};
    this.statuses = new JobStatus();
    this.listen();
  }

  emits = {
    getUnknown: 'dashboard:unknown'
  };

  events = {
    'job.new'(job, access) {
      this.addJob(job[0], access);
      this.changed();
    },
    'job.done'(job, access) {
      this.addJob(job[0], access);
      this.changed();
    }
  };

  job(id, access) {
    throw new Error('You must override this');
  };

  addJob(job, access) {
    throw new Error('You must implement');
  }

  listen() {
    let handler;
    Object.keys(this.events).forEach(event => {
      handler = this.events[event];
      if ('string' === typeof handler) handler = this[handler];
      this.sock.on(event, handler.bind(this));
    });
    Object.keys(this.statuses).forEach(status => {
      this.sock.on('job.status.' + status, this.update.bind(this, status));
    });
  }

  // access: 'yours', 'public', 'admin'
  update(event, args, access, dontchange) {
    const id = args.shift()
      , job = this.job(id, access)
      , handler = this.statuses[event];
    if (!job) return this.unknown(id, event, args, access);
    if (!handler) return;
    if ('string' === typeof handler) {
      job.status = handler;
    } else {
      handler.apply(job, args);
    }
    if (!dontchange) this.changed();
  }

  unknown(id, event, args, access) {
    args = [id].concat(args);
    if (this.waiting[id]) {
      return this.waiting[id].push([event, args, access]);
    }
    this.waiting[id] = [[event, args, access]];
    this.sock.emit(this.emits.getUnknown, id, this.gotUnknown.bind(this));
  }

  gotUnknown(job) {
    if (!this.waiting[job._id]) return console.warn('Got unknownjob:response but wan\'t waiting for it...');
    const access = this.waiting[job._id][0][2];
    if (job.status === 'submitted') {
      job.status = 'running';
      job.started = new Date();
    }
    // job.phase = job.phase || 'environment';
    this.addJob(job, access);
    // TODO: this.update searches for the job again. optimize
    for (let i = 0; i < this.waiting[job._id]; i++) {
      this.update.apply(this, this.waiting[i].concat([true]));
    }
    delete this.waiting[job._id];
    this.changed();
  }
}
