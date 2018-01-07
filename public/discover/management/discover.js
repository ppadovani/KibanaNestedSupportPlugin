import _ from 'lodash';
import 'plugins/nested-fields-support/index_pattern/management/less/main.less';
import { SavedObjectsClientProvider } from 'ui/saved_objects';

import routes from 'ui/routes';
import 'ui/paginated_table';
import uiModules from 'ui/modules';
import template from 'plugins/nested-fields-support/index_pattern/management/nested.html';

routes.when('/management/kibana/discover_results_configuration', {
  template,
  controller($scope, $route, $window, courier, Private) {
    const savedObjectsClient = Private(SavedObjectsClientProvider);

    $scope.indexPatternList = $route.current.locals.indexPatterns.map(pattern => {
      const id = pattern.id;
      const nested = pattern.get('nested');
      return {
        id: id,
        title: pattern.get('title'),
        nested: (nested !== undefined ? nested : false),
        class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
        default: $scope.defaultIndex === id
      };
    });

    function incrementDisplayPriority(field) {
      field.displayPriority = field.displayPriority + 1;
    }

    $scope.$watchMulti(['idx.nested'], refreshRows);

    function refreshRows() {
      $scope.indexPatternList = $route.current.locals.indexPatterns.map(pattern => {
        const id = pattern.id;
        const nested = pattern.get('nested');
        return {
          id: id,
          title: pattern.get('title'),
          nested: (nested !== undefined ? nested : false),
          class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
          default: $scope.defaultIndex === id
        };
      });
    }
  }
});
