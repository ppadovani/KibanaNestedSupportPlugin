import _ from 'lodash';
import {uiModules} from 'ui/modules';

const typeahead = uiModules.get('kibana/typeahead');

typeahead.directive('kbnTypeaheadChild', function () {
  return {
    scope: false,
    require: 'kbnTypeahead',
    link: function (scope, element, attr, controller) {

      controller.getItems = function() {
        let filteredItems = scope.$$childHead.filteredItems;
        if (filteredItems && scope.possibleFields) {
          filteredItems = _.difference(filteredItems, scope.possibleFields);
        }
        if (scope.possibleFields) {
          return scope.possibleFields.concat(filteredItems);
        }
        return filteredItems;
      };

      scope.$watch('possibleFields', function (filteredItems) {
        if (scope.possibleFields && scope.possibleFields.length > 0) {
          controller.active = true;
        }
      });
  }
}});

