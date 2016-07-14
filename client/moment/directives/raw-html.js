'use strict';

export default function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      const name = attrs.rawHtml;
      scope.$watch(name, function (value) {
        element[0].innerHTML = value || '';
      });
    }
  };
};
