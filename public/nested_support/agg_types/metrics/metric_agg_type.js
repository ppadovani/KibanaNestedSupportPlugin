import 'ui/courier';
import uiModules from 'ui/modules';
import AggTypesMetricsMetricAggTypeProvider from 'ui/agg_types/metrics/metric_agg_type';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  const MetricAggType = Private(AggTypesMetricsMetricAggTypeProvider);
  MetricAggType.prototype.getValue = function (agg, bucket) {
    // Metric types where an empty set equals `zero`
    const isSettableToZero = ['cardinality', 'sum'].indexOf(agg.__type.name) !== -1;

    // Return proper values when no buckets are present
    // `Count` handles empty sets properly
    if ((!bucket[agg.id] && !bucket['nested_' + agg.id])  && isSettableToZero) return 0;

    return (bucket[agg.id] || bucket['nested_' + agg.id][agg.id]).value;
  };
});
