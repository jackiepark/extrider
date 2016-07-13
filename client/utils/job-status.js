import PHASES from './phases';

export default class JobStatus {
  started(time) {
    this.started = time;
    this.phase = 'environment';
    this.status = 'running';
  }

  errored(error) {
    this.error = error;
    this.status = 'errored';
  }

  canceled = 'errored';

  'phase.done'(data) {
    this.phase = PHASES.indexOf(data.phase) + 1;
  }

  // this is just so we'll trigger the "unknown job" lookup sooner on the dashboard
  stdout(text) {
  }

  stderr(text) {
  }

  warning(warning) {
    if (!this.warnings) {
      this.warnings = [];
    }
    this.warnings.push(warning);
  }

  'plugin-data'(data) {
    const path = data.path ? [data.plugin].concat(data.path.split('.')) : [data.plugin];
    const last = path.pop();
    const method = data.method || 'replace';
    const parent = path.reduce((obj, attr) => obj[attr] || (obj[attr] = {}), this.plugin_data || (this.plugin_data = {}));

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
      parent[last] = { ...parent[last], ...data.data};
    } else {
      console.error('Invalid "plugin data" method received from plugin', data.plugin, data.method, data);
    }
  }
}
