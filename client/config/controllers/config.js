'use strict';

import $ from 'jquery';
import _ from 'lodash';
import md5 from 'md5';
import bootbox from 'bootbox';
import post from '../../utils/post';

const branches = global.branches || [];
const project = global.project || {};
const plugins = global.plugins || {};
const runners = global.runners || {};
const userIsCreator = global.userIsCreator || false;
const userConfigs = global.userConfigs || {};
const statusBlocks = global.statusBlocks || {};

function refreshCodeMirror({target}) {
  const tabId = $(target).attr('href');
  $(tabId).find('.CodeMirror').each(function(){
    this.CodeMirror && this.CodeMirror.refresh();
  });
}

export default function ConfigController($scope, $element, $sce) {
  // this is the parent controller.
  $scope.project = project;
  $scope.plugins = plugins;
  $scope.runners = runners;
  $scope.userIsCreator = userIsCreator;
  $scope.userConfigs = userConfigs;
  $scope.statusBlocks = statusBlocks;
  $scope.configured = {};
  $scope.branch = $scope.project.branches[0];
  $scope.branches = branches;
  $scope.disabled_plugins = {};
  $scope.configs = {};
  $scope.runnerConfigs = {};
  $scope.api_root = `/${$scope.project.name}/api/`;
  $scope.page = 'config';
  $scope.finishedRepeat = function (id) {
    // When a tab is shown, reload any CodeMirror instances within
    $('[data-toggle=tab]').on('shown', refreshCodeMirror);
  };

  $(function ConfigPageRouting() {
    const router = {
      init: function () {
        const self = this;

        // Set the URL when a tab is selected
        $('a[data-toggle="tab"]').on('show', function (e) {
          const tabName = $(e.target).attr('href').replace('#', '');
          const rootPath = global.location.pathname.split('/').slice(0, 4).join('/');
          const state = global.history.state;

          selectTab(tabName);

          if (state && state.tabName === tabName) {
            return; // don't double up!
          }

          global.history.pushState({ tabName: tabName }, global.document.title, rootPath + '/' + tabName);
        });

        // support the back button
        global.onpopstate = function () {
          self.route();
        };

        this.route();
      },

      route: function () {
        const pathParts = global.location.pathname.split('/');

        // Confirm we're on the config page
        if (pathParts.slice(0, 4)[3] === 'config') {
          this.routeConfigPage(pathParts);
        }
      },

      routeConfigPage: function (pathParts) {
        // Check the SessionStore to see if we should select a branch
        const branchName = global.sessionStorage.getItem('branchName');

        if (branchName) {
          switchToBranch(branchName);
        } else {
          global.sessionStorage.removeItem('branchName');
        }

        // Check the URL to see if we should go straight to a tab
        const lastPart = pathParts[pathParts.length-1];
        let tabName;

        if (pathParts.length === 5 && lastPart.length) {
          // Yes a tab was supplied
          tabName = lastPart;
          switchToTab(tabName, $scope.branch);
        }
      }
    };

    router.init();
  });

  function selectTab(tabName) {
    $('.tab-pane.active, .nav-tabs > li.active').removeClass('active');
    $('#' + tabName).addClass('active');
    $scope.selectedTab = tabName;
  }

  function switchToBranch(name) {
    const branch = _.findWhere($scope.branches, { name: name });

    if (branch) {
      $scope.branch = branch;
    }

    global.sessionStorage.setItem('branchName', $scope.branch.name);
    switchToTab('tab-branch-settings', $scope.branch);
  }

  $scope.switchToBranch = switchToBranch;

  function switchToTab(tab, branch) {
    if (!_.isString(tab)) {
      tab = branch && branch.name === 'master' ? 'tab-project' : 'tab-basic';
    }

    $(`#${tab}-tab-handle`).tab('show');
    selectTab(tab);
    $(`a[href='#${tab}']`).tab('show');
  }

  // When a tab is shown, reload any CodeMirror instances within
  $('[data-toggle=tab]').on('shown', refreshCodeMirror);

  $scope.switchToTab = switchToTab;

  const save_branches = {};

  $scope.refreshBranches = function () {
    // TODO implement
    throw new Error('Not implemented');
  };

  $scope.setEnabled = function (plugin, enabled) {
    $scope.configs[$scope.branch.name][plugin].enabled = enabled;
    savePluginOrder();
  };

  $scope.savePluginOrder = savePluginOrder;

  $scope.switchToMaster = function () {
    $scope.branch = $scope.project.branches.find(branch => branch.name === 'master');
  };

  $scope.clearCache = function () {
    $scope.clearingCache = true;
    $.ajax('/' + $scope.project.name + '/cache', {
      type: 'DELETE',
      success: function () {
        $scope.clearingCache = false;
        $scope.success('Cleared the cache', true);
      },
      error: function () {
        $scope.clearingCache = false;
        $scope.error('Failed to clear the cache', true);
      }
    });
  };

  $scope.$watch('branch.isCustomizable', function (value) {
    switchToTab('tab-branch-settings', $scope.branch);
  });

  $scope.toggleBranch = function () {
    if ($scope.branch.mirror_master) {
      $scope.branch.mirror_master = false;
      $scope.branch.isCustomizable = true;

      const name = $scope.branch.name;
      const master = $scope.project.branches.find(branch => branch.name === 'master');
      $scope.branch = $.extend(true, $scope.branch, master);
      $scope.branch.name = name;
      initBranch($scope.branch);
    }

    $scope.saveGeneralBranch(true);
  };

  $scope.mirrorMaster = function () {
    $scope.branch.mirror_master = true;
    $scope.branch.isCustomizable = false;
    delete $scope.branch.really_mirror_master;
    $scope.saveGeneralBranch(true);
  };

  $scope.setRunner = function (name) {
    const config = $scope.runnerConfigs[name];

    $scope.branch.runner.id = name;
    $scope.branch.runner.config = config;
    $scope.saveRunner(name, config);
  };

  function updateConfigured() {
    const plugins = $scope.branch.plugins;

    $scope.configured[$scope.branch.name] = {};
    plugins.forEach(plugin => {
      $scope.configured[$scope.branch.name][plugin.id] = true;
    });
    savePluginOrder();
  }

  function savePluginOrder() {
    const plugins = $scope.branch.plugins;
    const branch = $scope.branch;
    const project = $scope.project;
    const data = plugins.map(plugin => ({
      id: plugin.id,
      enabled: plugin.enabled,
      showStatus: plugin.showStatus
    }));

    saveProjectConfig({ plugin_order: data }, branch, project, function (err, result) {
      if (err) {
        return $scope.error('Error saving plugin order on branch ' + branch.name + ': ' + err, true);
      }

      $scope.success('Plugin order on branch ' + branch.name + ' saved.', true);
    });
  }

  $scope.reorderPlugins = function (list) {
    $scope.branch.plugins = list;
    savePluginOrder();
  };

  $scope.enablePlugin = function (target, index, event) {
    removeDragEl(event.target);
    // add to enabled list
    $scope.branch.plugins.splice(index, 0, target);
    // enable it
    _.find($scope.branch.plugins, { id: target.id }).enabled = true;
    // remove from disabled list
    const disabled = $scope.disabled_plugins[$scope.branch.name];
    disabled.splice(_.indexOf(_.pluck(disabled, 'id'), target.id), 1);
    updateConfigured();
  };

  $scope.disablePlugin = function (target, index, event) {
    removeDragEl(event.target);
    // add it to the disabled list
    $scope.disabled_plugins[$scope.branch.name].splice(index, 0, target);
    // remove it from enabled list
    const enabled = $scope.branch.plugins;
    enabled.splice(_.indexOf(_.pluck(enabled, 'id'), target.id), 1);
    updateConfigured();
  };

  $scope.setImgStyle = function (pluginInfo) {
    const pluginId = pluginInfo.id;
    const plugins = $scope.plugins;
    const plugin = plugins[pluginId];
    let icon, iconBg;

    if (plugin) {
      icon = plugin.icon;

      if (icon) {
        iconBg = 'url(\'/ext/' + pluginId + '/' + icon + '\')';
      }
    }

    pluginInfo.imgStyle = {
      'background-image': iconBg
    };
  };

  function initBranch(branch) {
    $scope.configured[branch.name] = {};
    $scope.configs[branch.name] = {};
    $scope.runnerConfigs[branch.name] = {};
    $scope.disabled_plugins[branch.name] = [];

    if (!branch.mirror_master) {
      branch.plugins.forEach(plugin => {
        $scope.configured[branch.name][plugin.id] = true;
        $scope.configs[branch.name][plugin.id] = plugin;
      });
    }

    Object.keys($scope.plugins).forEach(plugin => {
      if ($scope.configured[branch.name][plugin]) {
        return;
      }

      $scope.configs[branch.name][plugin] = {
        id: plugin,
        enabled: true,
        config: {}
      };

      $scope.disabled_plugins[branch.name].push($scope.configs[branch.name][plugin]);
    });

    if (!branch.mirror_master) {
      $scope.runnerConfigs[branch.name][branch.runner.id] = branch.runner.config;
    }

    Object.keys($scope.runners).forEach(runner => {
      if (!branch.mirror_master && runner === branch.runner.id) {
        return;
      }
      $scope.runnerConfigs[branch.name][runner] = {};
    });
  }

  function initPlugins() {
    const branches = $scope.project.branches;

    branches.forEach(branch => {
      initBranch(branch);
    });
  }

  $scope.saveGeneralBranch = function (plugins) {
    const branch = $scope.branch;
    const project = $scope.project;
    const data = {
      active: branch.active,
      privkey: branch.privkey,
      pubkey: branch.pubkey,
      envKeys: branch.envKeys,
      mirror_master: branch.mirror_master,
      deploy_on_green: branch.deploy_on_green,
      deploy_on_pull_request: branch.deploy_on_pull_request,
      runner: branch.runner
    };

    if (plugins) {
      data.plugins = branch.plugins;
    }

    saveProjectConfig(data, branch, project, function (err, result) {
      if (err) {
        return $scope.error('Error saving general config for branch ' + branch.name + ': ' + err, true);
      }

      $scope.success('General config for branch ' + branch.name + ' saved.', true);
    });
  };

  $scope.generateKeyPair = function () {
    bootbox.confirm('Really generate a new keypair? This could break things if you have plugins that use the current ones.', function (really) {
      if (!really) {
        return;
      }

      $.ajax('/' + $scope.project.name + '/keygen/?branch=' + encodeURIComponent($scope.branch.name), {
        type: 'POST',
        success: function (data, ts, xhr) {
          $scope.branch.privkey = data.privkey;
          $scope.branch.pubkey = data.pubkey;
          $scope.success('Generated new ssh keypair', true);
        }
      });
    });
  };

  initPlugins();

  $scope.gravatar = function (email) {
    if (!email) {
      return '';
    }

    const hash = md5(email.toLowerCase());
    return 'https://secure.gravatar.com/avatar/' + hash + '?d=identicon';
  };

  $scope.saveRunner = function (id, config) {
    $.ajax({
      url: '/' + $scope.project.name + '/config/branch/runner/id/?branch=' + encodeURIComponent($scope.branch.name),
      data: JSON.stringify({id: id, config: config}),
      contentType: 'application/json',
      type: 'PUT',
      success: function () {
        // TODO indicate to the user?
        $scope.success('Saved runner config.', true);
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          const data = $.parseJSON(xhr.responseText);
          $scope.error('Error setting runner id to ' + id);
        }
      }
    });
  };

  // todo: pass in name?
  $scope.runnerConfig = function (branch, data, next) {
    if (arguments.length === 2) {
      next = data;
      data = branch;
      branch = $scope.branch;
    }

    const name = $scope.branch.runner.id;

    if (arguments.length < 2) {
      return $scope.runnerConfigs[name];
    }

    $.ajax({
      url: '/' + $scope.project.name + '/config/branch/runner/?branch=' + encodeURIComponent($scope.branch.name),
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function (data, ts, xhr) {
        $scope.success('Runner config saved.');
        $scope.runnerConfigs[name] = data.config;
        next(null, data.config);
        $scope.$root.$digest();
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          const data = $.parseJSON(xhr.responseText);
          $scope.error('Error saving runner config: ' + data.errors[0]);
        } else {
          $scope.error('Error saving runner config: ' + e);
        }

        next();
        $scope.$root.$digest();
      }
    });
  };

  $scope.providerConfig = function (data, next) {
    if (arguments.length === 0) {
      return $scope.project.provider.config;
    }

    $.ajax({
      url: '/' + $scope.project.name + '/provider/',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function (data, ts, xhr) {
        $scope.success('Provider config saved.');
        next && next();
        $scope.$root.$digest();
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          $scope.error('Error saving provider config: ' + xhr.responseText);
        } else {
          $scope.error('Error saving provider config: ' + e);
        }

        next && next();
        $scope.$root.$digest();
      }
    });
  };

  $scope.pluginConfig = function (name, branch, data, next) {
    if (arguments.length === 3) {
      next = data;
      data = branch;
      branch = $scope.branch;
    }

    if (arguments.length === 1) {
      branch = $scope.branch;
    }

    if (branch.mirror_master) {
      return;
    }

    const plugin = $scope.configs[branch.name][name];

    if (arguments.length < 3) {
      return plugin.config;
    }

    if (plugin === null) {
      console.error('pluginConfig called for a plugin that\'s not configured. ' + name, true);
      throw new Error('Plugin not configured: ' + name);
    }

    $.ajax({
      url: '/' + $scope.project.name + '/config/branch/' + name + '/?branch=' + encodeURIComponent(branch.name),
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function (data, ts, xhr) {
        $scope.success('Config for ' + name + ' on branch ' + branch.name + ' saved.');
        $scope.configs[branch.name][name].config = data;
        next(null, data);
        $scope.$root.$digest();
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          const data = $.parseJSON(xhr.responseText);
          $scope.error('Error saving ' + name + ' config on branch ' + branch.name + ': ' + data.errors[0]);
        } else {
          $scope.error('Error saving ' + name + ' config on branch ' + branch.name + ': ' + e);
        }

        next();
        $scope.$root.$digest();
      }
    });
  };

  $scope.deleteProject = function () {
    $.ajax({
      url: '/' + $scope.project.name + '/',
      type: 'DELETE',
      success: function () {
        global.location = '/';
      },
      error: function () {
        $scope.deleting = false;
        $scope.error('failed to remove project', true);
      }
    });
  };

  // TODO: where is name coming from, I guessed it's from the params
  $scope.startTest = function (name) {
    $.ajax({
      url: '/' + $scope.project.name + '/start',
      data:{ branch: $scope.branch.name, type: 'TEST_ONLY', page: 'config' },
      type: 'POST',
      success: function () {
        global.location = '/' + $scope.project.name + '/';
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          const data = $.parseJSON(xhr.responseText);
          $scope.error('Error starting test job for ' + name + ' on branch ' + $scope.branch.name + ': ' + data.errors[0]);
        }
      }
    });
  };

  // TODO: where is name coming from, I guessed it's from the params
  $scope.startDeploy = function (name) {
    $.ajax({
      url: '/' + $scope.project.name + '/start',
      data:{ branch: $scope.branch.name, type: 'TEST_AND_DEPLOY', page: 'config' },
      type: 'POST',
      success: function () {
        global.location = '/' + $scope.project.name + '/';
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          const data = $.parseJSON(xhr.responseText);
          $scope.error('Error starting deploy job for ' + name + ' on branch ' + $scope.branch.name + ': ' + data.errors[0]);
        }
      }
    });
  };

  $scope.saveProject = function () {
    $.ajax({
      url: '/' + $scope.project.name + '/config',
      type: 'PUT',
      data: JSON.stringify({
        public: $scope.project.public
      }),
      contentType: 'application/json',
      success: function (data, ts, xhr) {
        $scope.success('General config saved.', true);
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          $scope.error('Error saving general config: ' + xhr.responseText, true);
        } else {
          $scope.error('Error saving general config: ' + e, true);
        }
      }
    });
  };

  $scope.post = post;
}

function removeDragEl(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function saveProjectConfig(data, branch, project, cb) {
  $.ajax({
    url: '/' + project.name + '/config/branch/?branch=' + encodeURIComponent(branch.name),
    type: 'PUT',
    data: JSON.stringify(data),
    contentType: 'application/json',
    success: function (data, ts, xhr) {
      cb(undefined, data);
    },
    error: function (xhr, ts, e) {
      cb(xhr && xhr.responseText || e);
    }
  });
}
