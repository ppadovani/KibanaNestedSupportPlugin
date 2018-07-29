import {toUser, toUserIndexPattern} from './lib/to_user';
import {fromUser, fromUserIndexPattern} from './lib/from_user';
import {uiModules} from 'ui/modules';

function getIndexPattern($scope) {
  let indexPattern = undefined;
  let curScope = $scope;
  while (indexPattern === undefined && curScope) {
    curScope = curScope.$parent;
    if (curScope) {
      indexPattern = curScope.indexPattern;
    }
  }
  // Check specifically for the $parent.agg
  if (!indexPattern && $scope.$parent.agg) {
    indexPattern = $scope.$parent.agg.vis.indexPattern;
  }
  return indexPattern;
}


uiModules
  .get('kibana')
  .directive('knqlParseQuery', function (Private) {

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        'ngModel': '='
      },
      link: function ($scope, elem, attr, ngModel, indexPattern) {
        let init = function () {
          $scope.ngModel = fromUser($scope.ngModel, ($scope ? $scope.$parent : undefined));
        };

        $scope.indexPattern = getIndexPattern($scope);

        let fieldMap;

        if ($scope.indexPattern) {
          if ($scope.indexPattern.nested) {
            attr.placeholder = 'Search.. (e.g. status=200 AND extension="PHP"';
          }
          fieldMap = $scope.indexPattern.fields;
        }

        toUserIndexPattern(fieldMap);
        fromUserIndexPattern(fieldMap);
        ngModel.$parsers.push(fromUser);
        ngModel.$formatters.push(toUser);

        init();

      }
    };
  });
