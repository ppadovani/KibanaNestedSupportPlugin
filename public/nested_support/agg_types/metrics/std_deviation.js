import _ from 'lodash';
import { AggTypesMetricsMetricAggTypeProvider } from 'ui/agg_types/metrics/metric_agg_type';
import { AggTypesMetricsGetResponseAggConfigClassProvider } from 'ui/agg_types/metrics/get_response_agg_config_class';
import { uiModules } from 'ui/modules';
import { AggTypesMetricsStdDeviationProvider } from 'ui/agg_types/metrics/std_deviation';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  const StdDeviationAggType = Private(AggTypesMetricsStdDeviationProvider);
  StdDeviationAggType.getValue = function (agg, bucket) {
	  let valueBucket = bucket;
	  if (bucket['nested_' + agg.parentId]) {
		  valueBucket = bucket['nested_' + agg.parentId];
	  }
      return _.get(valueBucket[agg.parentId], agg.valProp());
  };
});