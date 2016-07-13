'use strict';

export default function JobController($scope, $element) {
  const name = $element.attr('id').split('-').slice(1).join('-');

  $scope.saving = false;

  $scope.$watch('userConfigs["' + name + '"]', function (value) {
    $scope.userConfig = value;
  });

  $scope.$watch('configs[branch.name]["' + name + '"].config', function (value) {
    $scope.config = value;
  });

  $scope.save = function () {
    $scope.saving = true;
    $scope.pluginConfig(name, $scope.config, function () {
      $scope.saving = false;
    });
  };
}
