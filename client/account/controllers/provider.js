'use strict';

function ProviderController($scope, $element, $attrs) {
  const name = $attrs.id.split('-')[2];
  $scope.$watch('account.config', function (value) {
    $scope.config = value;
  });

  $scope.save = function () {
    $scope.saving = true;
    $scope.saveAccount(name, $scope.account, function () {
      $scope.saving = false;
    });
  };
}

export default ProviderController;
