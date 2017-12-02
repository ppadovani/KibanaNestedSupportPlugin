import toUser from 'ui/parse_query/lib/to_user';
import setIndexPattern from 'ui/parse_query/lib/to_user';
import ParseQueryLibFromUserProvider from 'ui/parse_query/lib/from_user';
import uiModules from 'ui/modules';
uiModules
  .get('kibana')
  .directive('parseQuery', function (Private) {
    let fromUser = Private(ParseQueryLibFromUserProvider);

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        'ngModel': '='
      },
      link: function ($scope, elem, attr, ngModel) {
        let init = function () {
          $scope.ngModel = fromUser($scope.ngModel, ($scope ? $scope.$parent : undefined));
        };

        let fieldMap;

        if ($scope.$parent.indexPattern) {
          fieldMap = $scope.$parent.indexPattern.fields;
        }

        toUser.setIndexPattern(fieldMap);
        fromUser.setIndexPattern(fieldMap);
        ngModel.$parsers.push(fromUser);
        ngModel.$formatters.push(toUser);

        init();
      }
    };
  });
