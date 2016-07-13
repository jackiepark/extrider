'use strict';

import JobMonitor from './job-monitor';
import SKELS from './skels';

function ensureCommand(phase) {
  let command = phase.commands[phase.commands.length - 1];
  if (!command || typeof(command.finished) !== 'undefined') {
    command = { ...SKELS.command };
    phase.commands.push(command);
  }
  return command;
}

export default class JobDataMonitor extends JobMonitor {
  constructor(...args) {
    super(...args);
    this.statuses = {
      ...super.statuses,
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
        let phase = this.phases[this.phase]
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
      stdout(text) {
        const command = ensureCommand(this.phases[this.phase]);
        command.out += text;
        command._merged += text;
        this.std.out += text;
        this.std.merged += text;
        this.std.merged_latest = text;
      },
      stderr(text) {
        let command = ensureCommand(this.phases[this.phase]);
        command.err += text;
        command._merged += text;
        this.std.err += text;
        this.std.merged += text;
        this.std.merged_latest = text;
      }
    }
  }
}
