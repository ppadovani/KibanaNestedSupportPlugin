import {uiModules} from 'ui/modules';

const typeahead = uiModules.get('kibana/typeahead');

typeahead.directive('kbnTypeaheadChild', function () {
  return {
    scope: false,
    require: 'kbnTypeahead',
    link: function (scope, element, attr, controller) {

      controller.getItems = function() {
        return $scope.filteredItems;
      }
    }
  }
});

