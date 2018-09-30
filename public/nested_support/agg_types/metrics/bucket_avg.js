import { ordinalSuffix } from 'ui/utils/ordinal_suffix';
import percentsEditor from 'ui/agg_types/controls/percentiles.html';
import 'ui/number_list';
import { AggTypesMetricsMetricAggTypeProvider } from 'ui/agg_types/metrics/metric_agg_type';
import { AggTypesMetricsGetResponseAggConfigClassProvider } from 'ui/agg_types/metrics/get_response_agg_config_class';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { bucketAvgMetricAgg } from 'ui/agg_types/metrics/bucket_avg';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  bucketAvgMetricAgg.getValue = function (agg, bucket) {
	  let valueBucket = bucket;
	  if (bucket['nested_' + agg.parentId]) {
		  valueBucket = bucket['nested_' + agg.parentId];
	  }
      const customMetric = agg.params.customMetric;
      const scaleMetrics = customMetric.type && customMetric.type.isScalable();

      let value = valueBucket[agg.id] && valueBucket[agg.id].value;
      if (scaleMetrics) {
        const aggInfo = agg.params.customBucket.write();
        value *= get(aggInfo, 'bucketInterval.scale', 1);
      }
      return value;
  }
});
