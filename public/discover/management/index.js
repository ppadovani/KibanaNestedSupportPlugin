import management from 'ui/management';
import './edit_index_pattern';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from './index.html';


const indexPatternsResolutions = {
  indexPatternIds: function (courier) {
    return courier.indexPatterns.getIds();
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
          const ids = $route.current.locals.indexPatternIds;
          $scope.indexPatternList = ids.map(function (id) {
            return {
              id: id,
              title: id,
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
