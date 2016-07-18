import PHASES from './phases' ;

// The Job Monitor:
// - update jobs based on browser events
//
export default class JobMonitor {
  constructor(socket, changed) {
    this.socket = socket;
    this.changed = changed;
    this.waiting = {};
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
  }

  addJob(job, access) {
    throw new Error('You must implement');
  }

  listen() {
    Object.keys(this.events).forEach(event => {
      let handler = this.events[event];
      if (typeof handler === 'string') handler = this[handler];
      this.socket.on(event, handler.bind(this));
    });
    Object.keys(this.statuses).forEach(status => {
      this.socket.on(`job.status.${status}`, this.update.bind(this, status));
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
    this.socket.emit(this.emits.getUnknown, id, this.gotUnknown.bind(this));
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

JobMonitor.prototype.statuses = {
  'started'(time) {
    this.started = time;
    this.phase = 'environment';
    this.status = 'running';
  },
  'errored'(error) {
    this.error = error;
    this.status = 'errored';
  },
  'canceled': 'errored',
  'phase.done'(data) {
    this.phase = PHASES.indexOf(data.phase) + 1;
  },
  // this is just so we'll trigger the "unknown job" lookup sooner on the dashboard
  'stdout'(text) {},
  'stderr'(text) {},
  'warning'(warning) {
    if (!this.warnings) {
      this.warnings = [];
    }
    this.warnings.push(warning);
  },
  'plugin-data'(data) {
    let path = data.path ? [data.plugin].concat(data.path.split('.')) : [data.plugin]
      , last = path.pop()
      , method = data.method || 'replace'
      , parent;
    parent = path.reduce(function (obj, attr) {
      return obj[attr] || (obj[attr] = {});
    }, this.plugin_data || (this.plugin_data = {}));
    if (method === 'replace') {
      parent[last] = data.data;
    } else if (method === 'push') {
      if (!parent[last]) {
        parent[last] = [];
      }
      parent[last].push(data.data);
    } else if (method === 'extend') {
      if (!parent[last]) {
        parent[last] = {};
      }
      parent[last] = { ...parent[last], ...data.data };
    } else {
      console.error('Invalid "plugin data" method received from plugin', data.plugin, data.method, data);
    }
  }
};
