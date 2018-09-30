import _ from 'lodash';
import { ordinalSuffix } from 'ui/utils/ordinal_suffix';
import 'ui/number_list';
import { AggTypesMetricsMetricAggTypeProvider } from 'ui/agg_types/metrics/metric_agg_type';
import { AggTypesMetricsGetResponseAggConfigClassProvider } from 'ui/agg_types/metrics/get_response_agg_config_class';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { stdDeviationMetricAgg } from 'ui/agg_types/metrics/std_deviation';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  stdDeviationMetricAgg.getValue = function (agg, bucket) {
	  let valueBucket = bucket;
	  if (bucket['nested_' + agg.parentId]) {
		  valueBucket = bucket['nested_' + agg.parentId];
	  }
      return _.get(valueBucket[agg.parentId], agg.valProp());
  };
});
