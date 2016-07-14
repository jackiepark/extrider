'use strict';

export default function (location, route) {
  const one = {
    controller: 'JobCtrl',
    templateUrl: 'build-tpl.html'
  };
  const routes = {
    '/': one,
    '/job/latest': one,
    '/job/:id': one
  };

  Object.keys(routes).forEach(function (path) {
    route.when(path, routes[path]);
  });

  // route.otherwise({redirectTo: '/'});
  location.html5Mode(true);
};
