/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import _ from 'lodash';
import chrome from 'ui/chrome';
import { BucketAggType } from 'ui/agg_types/buckets/_bucket_agg_type';
import { AggConfig } from 'ui/vis/agg_config';
import { Schemas } from 'ui/vis/editors/default/schemas';
import { createFilterTerms } from 'ui/agg_types/buckets/create_filter/terms';
import orderAggTemplate from 'ui/agg_types/controls/order_agg.html';
import orderAndSizeTemplate from 'ui/agg_types/controls/order_and_size.html';
import otherBucketTemplate from 'ui/agg_types/controls/other_bucket.html';

import { getRequestInspectorStats, getResponseInspectorStats } from 'ui/courier/utils/courier_inspector_utils';
import { buildOtherBucketAgg, mergeOtherBucketAggResponse, updateMissingBucket } from 'ui/agg_types/buckets/_terms_other_bucket_helper';
import { toastNotifications } from 'ui/notify';

import * as Terms from 'ui/agg_types/buckets/terms';

  const aggFilter = [
    '!top_hits', '!percentiles', '!median', '!std_dev',
    '!derivative', '!moving_avg', '!serial_diff', '!cumulative_sum',
    '!avg_bucket', '!max_bucket', '!min_bucket', '!sum_bucket'
  ];

  const orderAggSchema = (new Schemas([
    {
      group: 'none',
      name: 'orderAgg',
      title: 'Order Agg',
      hideCustomLabel: true,
      aggFilter: aggFilter
    }
  ])).all[0];

  function isNotType(type) {
    return function (agg) {
      const field = agg.params.field;
      return !field || field.type !== type;
    };
  }

  const migrateIncludeExcludeFormat = {
    serialize: function (value) {
      if (!value || _.isString(value)) return value;
      else return value.pattern;
    },
    write: function (aggConfig, output) {
      const value = aggConfig.params[this.name];
      if (_.isObject(value)) {
        output.params[this.name] = value.pattern;
      } else if (value) {
        output.params[this.name] = value;
      }
    }
  };

  function stripNested(aggs) {
    _.forOwn(aggs, function(value, key) {
      if (key.startsWith('nested_')) {
        const subAggKey = key.substr(7);
        aggs[subAggKey] = stripNested(value[subAggKey]);
        delete aggs[key];
      }
    });
    return aggs;
  }

  Terms.termsBucketAgg.postFlightRequest =  async (resp, aggConfigs, aggConfig, searchSource, inspectorAdapters) => {
    const nestedSearchSource = searchSource.createChild();
      if (aggConfig.params.otherBucket) {
        resp.aggregations = stripNested(resp.aggregations);
        const filterAgg = buildOtherBucketAgg(aggConfigs, aggConfig, resp);
      nestedSearchSource.setField('aggs', filterAgg);

      const request = inspectorAdapters.requests.start('Other bucket', {
        description: `This request counts the number of documents that fall
          outside the criterion of the data buckets.`
      });
      nestedSearchSource.getSearchRequestBody().then(body => {
        request.json(body);
      });
      request.stats(getRequestInspectorStats(nestedSearchSource));

      const response = await nestedSearchSource.fetch();
      request
        .stats(getResponseInspectorStats(nestedSearchSource, response))
        .ok({ json: response });
        resp = mergeOtherBucketAggResponse(aggConfigs, resp, response, aggConfig, filterAgg());
      }
      if (aggConfig.params.missingBucket) {
        resp = updateMissingBucket(resp, aggConfigs, aggConfig);
      }
      return resp;
    };

    Terms.termsBucketAgg.params.byName.orderAgg.controller = function ($scope) {
          $scope.safeMakeLabel = function (agg) {
            try {
              return agg.makeLabel();
            } catch (e) {
              return '- agg not valid -';
            }
          };

          const INIT = {}; // flag to know when prevOrderBy has changed
          let prevOrderBy = INIT;

          $scope.$watch('responseValueAggs', updateOrderAgg);
          $scope.$watch('agg.params.orderBy', updateOrderAgg);
          $scope.$watch('agg.params.countByParent', updateOrderAgg);

          // Returns true if the agg is not compatible with the terms bucket
          $scope.rejectAgg = function rejectAgg(agg) {
            return aggFilter.includes(`!${agg.type.name}`);
          };

          $scope.$watch('agg.params.field.type', (type) => {
            if (type !== 'string') {
              $scope.agg.params.missingBucket = false;
            }
          });

          function updateOrderAgg() {
            // abort until we get the responseValueAggs
            if (!$scope.responseValueAggs) return;
            const agg = $scope.agg;
            const params = agg.params;
            const orderBy = params.orderBy;
            const paramDef = agg.type.params.byName.orderAgg;

            // setup the initial value of orderBy
            if (!orderBy && prevOrderBy === INIT) {
              let respAgg = _($scope.responseValueAggs).filter((agg) => !$scope.rejectAgg(agg)).first();
              if (!respAgg) {
              respAgg = { id: '_key' };
              }
              params.orderBy = respAgg.id;
              return;
            }

            // track the previous value
            prevOrderBy = orderBy;

            // we aren't creating a custom aggConfig
            if (!orderBy || orderBy !== 'custom') {
              params.orderAgg = null;
              // ensure that orderBy is set to a valid agg
              const respAgg = _($scope.responseValueAggs).filter((agg) => !$scope.rejectAgg(agg)).find({ id: orderBy });
              if (!respAgg) {
              params.orderBy = '_key';
              }
              return;
            }

            params.orderAgg = params.orderAgg || paramDef.makeOrderAgg(agg);
          }
        };
Terms.termsBucketAgg.params.byName.orderAgg.write = function (agg, output, aggs) {
          const dir = agg.params.order.val;
          const order = output.params.order = {};

          let orderAgg = agg.params.orderAgg || aggs.getResponseAggById(agg.params.orderBy);

          // TODO: This works around an Elasticsearch bug the always casts terms agg scripts to strings
          // thus causing issues with filtering. This probably causes other issues since float might not
          // be able to contain the number on the elasticsearch side
          if (output.params.script) {
            output.params.valueType = agg.getField().type === 'number' ? 'float' : agg.getField().type;
          }

          if (agg.params.missingBucket && agg.params.field.type === 'string') {
            output.params.missing = '__missing__';
          }

          if (!orderAgg) {
            order[agg.params.orderBy || '_count'] = dir;
            return;
          }

          if (orderAgg.type.name === 'count') {
            if (dir === 'asc') {
            toastNotifications.addWarning('Sorting in Ascending order by Count in Terms aggregations is deprecated');
            }
            if (agg.params.countByParent) {
              order['count_' + agg.id] = dir;
            } else {
              order._count = dir;
            }
            return;
          }

          let orderAggId = orderAgg.id;
          if (orderAgg.parentId) {
            orderAgg = aggs.byId[orderAgg.parentId];
          }

          // if the target aggregation is nested, refer to it by its nested location
          if ((!orderAgg.params.field.nestedPath && agg.params.field.nestedPath) || orderAgg.params.field.nestedPath !== agg.params.field.nestedPath) {
            orderAggId = 'nested_' + orderAggId + '>' + orderAggId;
          }

          output.subAggs = (output.subAggs || []).concat(orderAgg);
          order[orderAggId] = dir;
        };
