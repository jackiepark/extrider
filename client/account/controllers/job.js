'use strict';

function JobController($scope, $element, $attrs) {
  const name = $attrs.id.split('-')[1];
  $scope.$watch('user.jobplugins["' + name + '"]', function (value) {
    $scope.config = value;
  });
}

export default JobController;
