import _ from 'lodash';
import 'ui/doc_table/doc_table.less';
import 'ui/styles/table.less';
import {uiModules} from 'ui/modules';
import template from './sample_result.html';
import { SearchSourceProvider } from 'ui/courier/search_source';

const MIN_LINE_LENGTH = 20;

const TAGS_WITH_WS = />\s+</g;

function noWhiteSpace(html) {
  return html.replace(TAGS_WITH_WS, '><');
}

uiModules.get('apps/management', ['kibana/courier'])
  .directive('discoverResultsConfigurationSampleResult', function (Private, courier) {

    const SearchSource = Private(SearchSourceProvider);

    const cellTemplate = _.template(noWhiteSpace(require('ui/doc_table/components/table_row/cell.html')));
    const truncateByHeightTemplate = _.template(noWhiteSpace(require('ui/partials/truncate_by_height.html')));

    return {
      restrict: 'E',
      template,
      scope: true,
      link: function ($scope) {
        $scope.$watchMulti(['[]indexPattern.fields', 'fieldFilter', 'indexedFieldTypeFilter', 'refreshSample'], refreshSample);
        $scope.$parent.$watchMulti(['refreshSample'], reformatSample);

        async function performQuery(searchSource) {
          const response = await searchSource;

          return _.get(response, ['hits', 'hits'], []);
        }

        /**
         * Fill an element with the value of a field
         */
        function _displayField(row, fieldName, truncate) {
          const indexPattern = $scope.indexPattern;
          const text = indexPattern.formatField(row, fieldName);

          if (truncate && text.length > MIN_LINE_LENGTH) {
            return truncateByHeightTemplate({
              body: text
            });
          }

          return text;
        }


        function reformatSample() {
          // $scope.flattenedRow = $scope.indexPattern.formatHit(response[0]);
          if ($scope.sampleHit && ($scope.$parent.refreshSample === undefined || $scope.$parent.refreshSample)) {
            if ($scope.sampleHit.$$_partialFormatted !== undefined) {
              $scope.sampleHit.$$_partialFormatted['_source'] = undefined;
            }
            $scope.flattenedRow = cellTemplate({
              timefield: false,
              sourcefield: true,
              formatted: _displayField($scope.sampleHit, '_source', true),
              filterable: false,
              column: '_source'
            });
            $scope.$parent.refreshSample = false;
          }
        }


        function refreshSample() {
          if ($scope.$parent.refreshSample === undefined || $scope.$parent.refreshSample) {

            performQuery(new SearchSource().setField('index', $scope.indexPattern).setField('size', 1)
              .fetch()).then(response => {
                $scope.sampleHit = response[0];
              reformatSample();
            });
          }
        }

      }
    }
  });
