import _ from 'lodash';
import {DocViewsRegistryProvider} from 'ui/registry/doc_views';
import { uiModules } from 'ui/modules';

import tableHtml from './structure.html';

uiModules.get('kibana')
    .run(function (config, Private) {
      const docViews = Private(DocViewsRegistryProvider);
      docViews.byName.Table.directive.template = tableHtml;
      docViews.byName.Table.directive.controller = structureController;
    });

function structureController($scope) {
  $scope.mapping = $scope.indexPattern.fields.byName;
  $scope.flattened = $scope.indexPattern.flattenHit($scope.hit, false);
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
    if (partials && partials[key] !== undefined) {
      text = partials[key];
    } else {
      text = partials[key] = $scope.indexPattern.formatField($scope.hit, fieldName, (row !== undefined ? row[fieldName] : undefined), pos);
    }

    return _.trunc(text, {'length': 200});
  };
}
