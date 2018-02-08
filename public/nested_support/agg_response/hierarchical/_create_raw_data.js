import { createRawData } from 'ui/agg_response/hierarchical/_create_raw_data';


createRawData.walkBuckets = function (agg, data, record) {
  if (!data) return;
  if (!Array.isArray(record)) {
    record = [];
  }

  // iterate through all the buckets
  _.each(extractBuckets(data[agg.id] || data['nested_' + agg.id][agg.id]), function (bucket) {

    const _record = _.flattenDeep([record, bucket.key]);
    _.each(metrics, function (metric) {
      let value = bucket.doc_count;
      if (bucket[metric.id] && !_.isUndefined(bucket[metric.id].value)) {
        value = bucket[metric.id].value;
      }
      _record.push(value);
    });

    // If there is another agg to call we need to check to see if it has
    // buckets. If it does then we need to keep on walking the tree.
    // This is where the recursion happens.
    if (agg._next) {
      const nextBucket = bucket[agg._next.id];
      if (nextBucket && nextBucket.buckets) {
        walkBuckets(agg._next, bucket, _record);
      }
    }
    // if there are no more aggs to walk then  push the record to the rows.
    else {
      results.rows.push(_record);
    }
  });
};
