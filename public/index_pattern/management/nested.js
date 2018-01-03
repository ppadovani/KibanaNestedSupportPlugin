import _ from 'lodash';
import 'plugins/nested-fields-support/index_pattern/management/less/main.less';
import { SavedObjectsClientProvider } from 'ui/saved_objects';

import routes from 'ui/routes';
import 'ui/paginated_table';
import { uiModules } from 'ui/modules';
import template from 'plugins/nested-fields-support/index_pattern/management/nested.html';
// import IndexPatternsPatternToWildcardProvider from 'ui/index_patterns/_pattern_to_wildcard';

routes.when('/management/kibana/nested_configuration', {
  template,
  controller($scope, $route, $window, courier, Private) {
    const savedObjectsClient = Private(SavedObjectsClientProvider);
//    const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('data');
    // const patternToWildcard = Private(IndexPatternsPatternToWildcardProvider);

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

    $scope.activateIndex = function (pattern) {
      courier.indexPatterns.get(pattern.id).then(index_pattern => {
        savedObjectsClient._$http.get('../api/nested-fields-support/mappings/' + index_pattern.title).then(response => {
          let hierarchyPaths = {};
          _.each(response.data, function (index, indexName) {
            if (indexName === '.kibana') return;
            _.each(index.mappings, function (mappings, typeName) {
              var parent = mappings._parent;
              _.each(mappings.properties, function (field, name) {
                // call the define mapping recursive function
                defineMapping(parent, hierarchyPaths, undefined, name, field, undefined);
              });
            });
          });
          _.each(index_pattern.fields, function (field) {
            if ( hierarchyPaths[field.name] !== undefined ) {
              field.nestedPath = hierarchyPaths[field.name];
              index_pattern.fields.byName[field.name].nestedPath = hierarchyPaths[field.name];
            }
          });
          index_pattern.activateNested();

          index_pattern.save();
        });
     }).then(response => {
        pattern.nested = true;
      });
    };

    $scope.deactivateIndex = function (pattern) {
      courier.indexPatterns.get(pattern.id).then(response => {
        response.deactivateNested();
        response.save();
      }).then(response => {
        pattern.nested = false;
      });
    };

    function defineMapping(parent, hierarchyPaths, parentPath, name, rawField, nestedPath) {
      let fullName = name;
      // build the fullName first
      if (parentPath !== undefined) {
        fullName = parentPath + '.' + name;
      }

      if (rawField.type !== undefined) {
        if (rawField.type === 'nested') {
          nestedPath = fullName;
        }

        hierarchyPaths[fullName] = nestedPath;
      }

      _.each(rawField.properties, function (field, name) {
        defineMapping(parent, hierarchyPaths, fullName, name, field, nestedPath);
      });

      _.each(rawField.fields, function (field, name) {
        defineMapping(parent, hierarchyPaths, fullName, name, field, nestedPath);
      });

    }

  }
});
