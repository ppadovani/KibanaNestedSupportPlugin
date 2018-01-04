import { management } from 'ui/management';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import './edit_index_pattern';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';
import indexTemplate from './index.html';


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
  .defaults(/management\/kibana\/discover_results_configuration/, {
    resolve: indexPatternsResolutions
  });

// wrapper directive, which sets some global stuff up like the left nav
uiModules.get('apps/management')
  .directive('discoverResultsConfiguration', function ($route, config, kbnUrl) {
    return {
      restrict: 'E',
      transclude: true,
      template: indexTemplate,
      link: function ($scope) {
        $scope.editingId = $route.current.params.indexPatternId;
        config.bindToScope($scope, 'defaultIndex');

        $scope.$watch('defaultIndex', function () {
          $scope.indexPatternList = $route.current.locals.indexPatterns.map(pattern => {
            const id = pattern.id;

            return {
              id: id,
              title: pattern.get('title'),
              url: kbnUrl.eval('#/management/kibana/discover_results_configuration/{{id}}', { id: id }),
              class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
              default: $scope.defaultIndex === id
            };
          });
        });

        $scope.$emit('application.load');
      }
    };
  });

management
  .getSection('kibana')
  .register('discover_results_configuration', {
    display: 'Discover Settings',
    order: 5,
    url: '#/management/kibana/discover_results_configuration/',
    tooltip: 'Customize Discover application display of results.'
  });
