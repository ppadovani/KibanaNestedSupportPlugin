import { ordinalSuffix } from 'ui/utils/ordinal_suffix';
import percentsEditor from 'ui/agg_types/controls/percentiles.html';
import 'ui/number_list';
import { AggTypesMetricsMetricAggTypeProvider } from 'ui/agg_types/metrics/metric_agg_type';
import { AggTypesMetricsGetResponseAggConfigClassProvider } from 'ui/agg_types/metrics/get_response_agg_config_class';
import { getPercentileValue } from './percentiles_get_value';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { AggTypesMetricsPercentilesProvider } from 'ui/agg_types/metrics/percentiles';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  const PercentilesAggType = Private(AggTypesMetricsPercentilesProvider);
  PercentilesAggType.getValue = getPercentileValue;
});
