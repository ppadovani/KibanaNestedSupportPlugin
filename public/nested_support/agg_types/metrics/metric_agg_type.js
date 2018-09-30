import _ from 'lodash';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { MetricAggType } from 'ui/agg_types/metrics/metric_agg_type';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  MetricAggType.prototype.getValue = function (agg, bucket) {
    // Metric types where an empty set equals `zero`
    const isSettableToZero = ['cardinality', 'sum'].indexOf(agg.__type.name) !== -1;

    // Return proper values when no buckets are present
    // `Count` handles empty sets properly
    bucket = stripNested(bucket);
    if (!bucket[agg.id] && isSettableToZero) return 0;

    return bucket[agg.id].value;
  };

  function stripNested (parent) {
    _.forOwn(parent, function(value, key) {
      if (key.startsWith('nested_')) {
        _.forOwn(value, function(child, childKey) {
          parent[childKey] = child;
          stripNested(child);
        });
        delete parent[key];
      }
    });
    return parent;
  }

});
