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
import { TabbedAggResponseWriter } from 'ui/agg_response/tabify/_response_writer';
import { TabifyBuckets } from './_buckets';
import * as tabify from 'ui/agg_response/tabify/tabify';

tabify.tabifyAggResponse = function(aggs, esResponse, respOpts) {
    const write = new TabbedAggResponseWriter(aggs, respOpts);

    const topLevelBucket = _.assign({}, esResponse.aggregations, {
      doc_count: esResponse.hits.total
    });

    collectBucket(write, undefined, topLevelBucket, '', 1);

    return write.response();
  };

  /**
   * read an aggregation from a bucket, which is *might* be found at key (if
   * the response came in object form), and will recurse down the aggregation
   * tree and will pass the read values to the ResponseWriter.
   *
   * @param {object} bucket - a bucket from the aggResponse
   * @param {undefined|string} key - the key where the bucket was found
   * @returns {undefined}
   */
  function collectBucket(write, id, bucket, key, aggScale) {
    const agg = write.aggStack.shift();
    const aggInfo = agg.write(write.aggs);
    aggScale *= aggInfo.metricScale || 1;

    switch (agg.type.type) {
      case 'buckets':
        let buckets = new TabifyBuckets(bucket[agg.id], agg.params);
        if (bucket['nested_' + agg.id] !== undefined) {
          buckets = new TabifyBuckets(bucket['nested_' + agg.id][agg.id], agg.params);
        }
        if (buckets.length) {
          const splitting = write.canSplit && agg.schema.name === 'split';
          if (splitting) {
            write.split(agg, buckets, function forEachBucket(subBucket, key) {
              collectBucket(write, agg.id, subBucket, agg.getKey(subBucket, key), aggScale);
            });
          } else {
            buckets.forEach(function (subBucket, key) {
              write.cell(agg, agg.getKey(subBucket, key), function () {
                collectBucket(write, agg.id, subBucket, agg.getKey(subBucket, key), aggScale);
              });
            });
          }
        } else if (write.partialRows && write.metricsForAllBuckets && write.minimalColumns) {
          // we don't have any buckets, but we do have metrics at this
          // level, then pass all the empty buckets and jump back in for
          // the metrics.
          write.aggStack.unshift(agg);
          passEmptyBuckets(write, bucket, key, aggScale);
          write.aggStack.shift();
        } else {
          // we don't have any buckets, and we don't have isHierarchical
          // data, so no metrics, just try to write the row
          write.row();
        }
        break;
      case 'metrics':
        let value = agg.getValue(id, bucket);
        // since the aggregation could be a non integer (such as a max date)
        // only do the scaling calculation if it is needed.
        if (aggScale !== 1) {
          value *= aggScale;
        }
        write.cell(agg, value, function () {
          if (!write.aggStack.length) {
            // row complete
            write.row();
          } else {
            // process the next agg at this same level
            collectBucket(write, agg.id, bucket, key, aggScale);
          }
        });
        break;
    }

    write.aggStack.unshift(agg);
  }

  // write empty values for each bucket agg, then write
  // the metrics from the initial bucket using collectBucket()
  function passEmptyBuckets(write, bucket, key, aggScale) {
    const agg = write.aggStack.shift();

    switch (agg.type.type) {
      case 'metrics':
        // pass control back to collectBucket()
        write.aggStack.unshift(agg);
        collectBucket(write, bucket, key, aggScale);
        return;

      case 'buckets':
        write.cell(agg, '', function () {
          passEmptyBuckets(write, bucket, key, aggScale);
        });
    }

    write.aggStack.unshift(agg);
  }
