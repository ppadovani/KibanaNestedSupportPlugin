import valuesEditor from 'ui/agg_types/controls/percentile_ranks.html';
import 'ui/number_list';
import { AggTypesMetricsMetricAggTypeProvider } from 'ui/agg_types/metrics/metric_agg_type';
import { AggTypesMetricsGetResponseAggConfigClassProvider } from 'ui/agg_types/metrics/get_response_agg_config_class';
import { RegistryFieldFormatsProvider } from 'ui/registry/field_formats';
import { getPercentileValue } from './percentiles_get_value';
import { uiModules } from 'ui/modules';
import { AggTypesMetricsPercentileRanksProvider } from 'ui/agg_types/metrics/percentile_ranks';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
    const PercentileRanksAggType = Private(AggTypesMetricsPercentileRanksProvider);
    PercentileRanksAggType.getValue = function (agg, bucket) {
        return getPercentileValue(agg, bucket) / 100;
    }
  });