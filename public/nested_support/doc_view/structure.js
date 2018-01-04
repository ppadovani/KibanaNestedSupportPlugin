import _ from 'lodash';
import {DocViewsRegistryProvider} from 'ui/registry/doc_views';

import tableHtml from './structure.html';

DocViewsRegistryProvider.register(function () {
  return {
    title: 'Structure',
    order: 5,
    directive: {
      template: tableHtml,
      scope: {
        hit: '=',
        indexPattern: '=',
        filter: '=',
        columns: '=',
        onAddColumn: '=',
        onRemoveColumn: '='
      },
      controller: function ($scope) {
        $scope.mapping = $scope.indexPattern.fields.byName;
        $scope.flattened = $scope.indexPattern.flattenHit($scope.hit);
        $scope.formatted = $scope.indexPattern.formatHit($scope.hit, true);
        $scope.fields = _.keys($scope.flattened).sort();
        $scope.visible = {};

        $scope.canToggleColumns = function canToggleColumn() {
          return (
              _.isFunction($scope.onAddColumn)
              && _.isFunction($scope.onRemoveColumn)
          );
        };

        $scope.toggleColumn = function toggleColumn(columnName) {
          if ($scope.columns.includes(columnName)) {
            $scope.onRemoveColumn(columnName);
          } else {
            $scope.onAddColumn(columnName);
          }
        };

        $scope.visible = function (field, pos) {
          let key = field;
          if (pos !== undefined) {
            key += pos;
          }
          return $scope.visible[key];
        };

        $scope.toggleVisible = function (field, pos) {
          let key = field;
          if (pos !== undefined) {
            key += pos;
          }
          if ($scope.visible[key] === undefined) {
            $scope.visible[key] = key;
          } else {
            $scope.visible[key] = undefined;
          }
        };

        $scope.showArrayInObjectsWarning = function (row, field) {
          let value = $scope.flattened[field];
          if (row !== undefined) {
            value = row[field];
          }
          return _.isArray(value) && typeof value[0] === 'object';
        };

        $scope.rowSummary = function (row, fieldName, pos) {
          const partials = $scope.hit.$$_partialFormatted;
          let key = fieldName;
          let text = '';
          if (pos !== undefined) {
            key += pos;
          }
          if (partials && partials[key] != null) {
            text = partials[key];
          } else {
            text = partials[key] = $scope.indexPattern._legacyFormatField($scope.hit, fieldName);
          }

          return _.trunc(text, {'length': 200});
        };
      }
    }
  };
});