import _ from 'lodash';
// import 'plugins/kibana/management/sections/indices/edit_index_pattern/index_header';
// import 'plugins/kibana/management/sections/indices/edit_index_pattern/indexed_fields_table';
// import 'plugins/kibana/management/sections/indices/edit_index_pattern/scripted_fields_table';
// import 'plugins/kibana/management/sections/indices/edit_index_pattern/scripted_field_editor';
// import 'plugins/kibana/management/sections/indices/edit_index_pattern/source_filters_table';
import UrlProvider from 'ui/url';
import { IndicesEditSectionsProvider } from './edit_sections';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';
import template from './edit_nested_configuration.html';

uiRoutes
  .when('/management/kibana/indices/:indexPatternId', {
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
  .when('/management/kibana/indices', {
    resolve: {
      redirect: function ($location, config) {
        const defaultIndex = config.get('defaultIndex');
        let path = '/management/kibana/index';

        if (defaultIndex) {
          path = `/management/kibana/indices/${defaultIndex}`;
        }

        $location.path(path).replace();
      }
    }
  });

uiModules.get('apps/management')
  .controller('managementIndicesEdit', function (
    $scope, $location, $route, config, courier, Notifier, Private, AppState, docTitle, confirmModal) {
    const notify = new Notifier();
    const $state = $scope.state = new AppState();

    $scope.kbnUrl = Private(UrlProvider);
    $scope.indexPattern = $route.current.locals.indexPattern;
    docTitle.change($scope.indexPattern.title);

    const otherPatterns = _.filter($route.current.locals.indexPatterns, pattern => {
      return pattern.id !== $scope.indexPattern.id;
    });


  });
