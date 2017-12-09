import { management } from 'ui/management';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import uiRoutes from 'ui/routes';
import routes from 'ui/routes';
import 'plugins/nested-fields-support/index_pattern/management/nested';

// routes.defaults(/\/manageent/, {
//   resolve: {
//     nestedManagementSection: function (Private) {
//       const kibanaManagementSection = management.getSection('kibana');
//       kibanaManagementSection.deregister('nested_configuration');
//       return kibanaManagementSection.register('nested_configuration', {
//         order: 5,
//         display: 'Nested Fields',
//         url: '#/management/kibana/nested_configuration',
//         tooltip: 'Activate/Deactivate nested field support for an index pattern.'
//       });
//     }
//   }
// });

const indexPatternsResolutions = {
  indexPatterns: function (Private) {
    const savedObjectsClient = Private(SavedObjectsClientProvider);

    return savedObjectsClient.find({
      type: 'index-pattern',
      fields: ['title','nested'],
      perPage: 10000
    }).then(response => response.savedObjects);
  }
};

uiRoutes
  .defaults(/management\/kibana\/nested_configuration/, {
    resolve: indexPatternsResolutions
  });

management
  .getSection('kibana')
  .register('nested_configuration', {
    display: 'Nested Fields',
    order: 5,
    url: '#/management/kibana/nested_configuration/',
    tooltip: 'Activate/Deactivate nested field support for an index pattern.'
  });

// routes.when('/management/kibana/nested_configuration', {
//   template,
//   controller: function ($scope, $window) {
//     // ...
//     $scope.indexPatternList = $route.current.locals.indexPatterns.map(pattern => {
//       const id = pattern.id;
//
//       return {
//         id: id,
//         title: pattern.get('title'),
//         url: kbnUrl.eval('#/management/kibana/indices/{{id}}', {id: id}),
//         class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
//         default: $scope.defaultIndex === id
//       };
//     });
//
//     $scope.save = () => {
//       $window.location.reload();
//     }
//   }
// });