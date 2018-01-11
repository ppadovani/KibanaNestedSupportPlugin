import _ from 'lodash';
import 'plugins/nested-fields-support/index_pattern/management/less/main.less';
import 'ui/courier';
import 'ui/index_patterns';

import routes from 'ui/routes';
import 'ui/paginated_table';
import uiModules from 'ui/modules';
import template from 'plugins/nested-fields-support/index_pattern/management/nested.html';

const app = uiModules.get('apps/management', [
  'kibana/courier',
  'kibana/index_patterns'
]);


function fetchPatterns (courier) {
    var promise = new Promise(function() {
      return courier.indexPatterns.getIds().then(ids => ids.map(id => {
        courier.indexPatterns.get(id).then(pattern => {
        return {
          id: pattern.id,
          title: pattern.id,
          nested: (pattern.nested !== undefined ? pattern.nested : false)
        };
    })
    }))
    });
    return promise;
  };

routes.when('/management/kibana/nested_configuration', {
  template,
  resolve: {
    indexPatternList: function(courier) {
      return fetchPatterns(courier);
    }
  },
  // resolve: {
  //   indexPatternList: fetchPatterns
  // },
  controller($scope, $route, $window, courier, Private) {

    // const ids = $route.current.locals.indexPatternIds;
    // $scope.indexPatternList = [];
    // for (var id in ids) {
    //   $scope.indexPatternList.push(Promise.resolve(courier.indexPatterns.get(id)));
    // }
    //   Promise.all(ids.map(function (id) {
    //   courier.indexPatterns.get(id).then(pattern =>{
    //     return {
    //       id: pattern.id,
    //       title: pattern.id,
    //       nested: (pattern.nested !== undefined ? pattern.nested : false),
    //       class: 'sidebar-item-title ' + ($scope.editingId === pattern.id ? 'active' : ''),
    //       default: $scope.defaultIndex === pattern.id
    //     };
    //   });
    // }));

    $scope.indexPatternList = $route.current.locals.indexPatternList;

    $scope.$watchMulti(['idx.nested'], refreshRows);

    function refreshRows() {
      // const ids = $route.current.locals.indexPatternIds;
      // $scope.indexPatternList = [];
      // for (var id in ids) {
      //   $scope.indexPatternList.push(Promise.resolve(courier.indexPatterns.get(id)));
      // }
    }

    $scope.activateIndex = function (pattern) {
      courier.indexPatterns.get(pattern.id).then(index_pattern => {
        courier._$http.get('../api/nested-fields-support/mappings/' + index_pattern.title).then(response => {
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
        if (hierarchyPaths[field.name] !== undefined) {
          field.nestedPath = hierarchyPaths[field.name];
          index_pattern.fields.byName[field.name].nestedPath = hierarchyPaths[field.name];
        }
      });
      index_pattern.activateNested();

      index_pattern.save();
    })
      ;
    }).
      then(response => {
        pattern.nested = true;
    })
      ;
    };

    $scope.deactivateIndex = function (pattern) {
      courier.indexPatterns.get(pattern.id).then(response => {
        response.deactivateNested();
      response.save();
    }).
      then(response => {
        pattern.nested = false;
    })
      ;
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
