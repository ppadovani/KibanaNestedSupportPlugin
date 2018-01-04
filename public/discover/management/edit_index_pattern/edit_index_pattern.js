import _ from 'lodash';
import './index_header';
import './indexed_fields_table';
import './sample_result';
import UrlProvider from 'ui/url';
import {IndicesEditSectionsProvider} from './edit_sections';
import uiRoutes from 'ui/routes';
import {uiModules} from 'ui/modules';
import template from './edit_index_pattern.html';

uiRoutes
  .when('/management/kibana/discover_results_configuration/:indexPatternId', {
    template,
    resolve: {
      indexPattern: function ($route, courier) {
        return courier.indexPatterns
          .get($route.current.params.indexPatternId)
          .catch(courier.redirectWhenMissing('/management/kibana/index'));
      }
    }
  });

uiRoutes
  .when('/management/kibana/discover_results_configuration', {
    resolve: {
      redirect: function ($location, config) {
        const defaultIndex = config.get('defaultIndex');
        let path = '/management/kibana/discover_results_configuration';

        if (defaultIndex) {
          path = `/management/kibana/discover_results_configuration/${defaultIndex}`;
        }

        $location.path(path).replace();
      }
    }
  });

uiModules.get('apps/management')
  .controller('discoverResultsConfigurationEdit', function ($scope, $location, $route, config, courier, Notifier, Private, AppState, docTitle, confirmModal) {
    const notify = new Notifier();
    const $state = $scope.state = new AppState();

    $scope.kbnUrl = Private(UrlProvider);
    $scope.indexPattern = $route.current.locals.indexPattern;
    $scope.refreshSample = true;
    docTitle.change($scope.indexPattern.title);

    const otherPatterns = _.filter($route.current.locals.indexPatterns, pattern => {
      return pattern.id !== $scope.indexPattern.id;
    });

    $scope.$watch('indexPattern.fields', function () {
      $scope.editSections = Private(IndicesEditSectionsProvider)($scope.indexPattern);
      $scope.refreshFilters();
    });

    $scope.refreshFilters = function () {
      const indexedFieldTypes = [];
      $scope.indexPattern.fields.forEach(field => {
        indexedFieldTypes.push(field.type);
      });

      $scope.indexedFieldTypes = _.unique(indexedFieldTypes);
    };

    $scope.changeFilter = function (filter, val) {
      $scope[filter] = val || ''; // null causes filter to check for null explicitly
    };

    $scope.$watchCollection('indexPattern.fields', function () {
      $scope.conflictFields = $scope.indexPattern.fields
        .filter(field => field.type === 'conflict');
    });
  });
