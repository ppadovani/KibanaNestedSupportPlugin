import { MetricAggType } from 'ui/agg_types/metrics/metric_agg_type';

MetricAggType.prototype.getValue = function (agg, bucket) {
  // Metric types where an empty set equals `zero`
  const isSettableToZero = ['cardinality', 'sum'].indexOf(agg.__type.name) !== -1;

  // Return proper values when no buckets are present
  // `Count` handles empty sets properly
  if ((!bucket[agg.id] && !bucket['nested_' + agg.id])  && isSettableToZero) return 0;

  return (bucket[agg.id] || bucket['nested_' + agg.id][agg.id]).value;
};