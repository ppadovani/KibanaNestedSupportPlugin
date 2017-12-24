import {Tabify} from 'ui/agg_response/tabify/tabify';

Tabify.tabifyAggResponse = function (vis, esResponse, respOpts) {
  const write = new TabbedAggResponseWriter(vis, respOpts);

  const topLevelBucket = _.assign({}, esResponse.aggregations, {
    doc_count: esResponse.hits.total
  });

  collectBucket(write, undefined, topLevelBucket);

  return write.response();
};

Tabify.collectBucket = function (write, id, bucket, key) {
  const agg = write.aggStack.shift();

  switch (agg.schema.group) {
    case 'buckets':
      let buckets = new Buckets(bucket[agg.id]);
      if (bucket['nested_' + agg.id] !== undefined) {
        buckets = new Buckets(bucket['nested_' + agg.id][agg.id]);
      }
      if (buckets.length) {
        const splitting = write.canSplit && agg.schema.name === 'split';
        if (splitting) {
          write.split(agg, buckets, function forEachBucket(subBucket, key) {
            collectBucket(write, agg.id, subBucket, agg.getKey(subBucket), key);
          });
        } else {
          buckets.forEach(function (subBucket, key) {
            write.cell(agg, agg.getKey(subBucket, key), function () {
              collectBucket(write, agg.id, subBucket, agg.getKey(subBucket, key));
            });
          });
        }
      } else if (write.partialRows && write.metricsForAllBuckets && write.minimalColumns) {
        // we don't have any buckets, but we do have metrics at this
        // level, then pass all the empty buckets and jump back in for
        // the metrics.
        write.aggStack.unshift(agg);
        passEmptyBuckets(write, bucket, key);
        write.aggStack.shift();
      } else {
        // we don't have any buckets, and we don't have isHierarchical
        // data, so no metrics, just try to write the row
        write.row();
      }
      break;
    case 'metrics':
      const value = agg.getValue(id, bucket);
      write.cell(agg, value, function () {
        if (!write.aggStack.length) {
          // row complete
          write.row();
        } else {
          // process the next agg at this same level
          collectBucket(write, agg.id, bucket, key);
        }
      });
      break;
  }

  write.aggStack.unshift(agg);
};