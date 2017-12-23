import { toUser, toUserIndexPattern } from './lib/to_user';
import { fromUser, fromUserIndexPattern } from './lib/from_user';


import {uiModules} from 'ui/modules';

uiModules
  .get('kibana')
  .config(function ($provide) {
    $provide.decorator('parseQueryDirective', function ($delegate) {

      var directive, link;
      directive = $delegate[0];
      link = directive.link;
      directive.compile = function() {
        return function Link($scope, elem, attr, ngModel) {
          let init = function () {
            $scope.ngModel = fromUser($scope.ngModel, ($scope ? $scope.$parent : undefined));
          };

          let fieldMap;

          if ($scope.$parent.indexPattern.nested) {
            attr.placeholder = 'Search.. (e.g. status=200 AND extension="PHP"';
          }

          if ($scope.$parent.indexPattern) {
            fieldMap = $scope.$parent.indexPattern.fields;
          }

          toUserIndexPattern(fieldMap);
          fromUserIndexPattern(fieldMap);
          ngModel.$parsers.push(fromUser);
          ngModel.$formatters.push(toUser);

          init();

        };
      };
      return $delegate;

    });
  });

