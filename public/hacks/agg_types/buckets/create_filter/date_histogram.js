import moment from 'moment';
import { buildRangeFilter } from 'ui/filter_manager/lib/range';

import * as DatehistogramFilter from 'agg_types/buckets/create_filter/date_histogram';

DatehistogramFilter.AggTypesBucketsCreateFilterDateHistogramProvider = function () {

  return function (agg, key) {
    const start = moment(key);
    const interval = agg.buckets.getInterval();

    let filter = buildRangeFilter(agg.params.field, {
      gte: start.valueOf(),
      lt: start.add(interval).valueOf(),
      format: 'epoch_millis'
    }, agg.vis.indexPattern);
    if (agg.params.nested) {
      filter = { 'nested' : { 'query' : { 'bool' : { 'must' : [{filter}]}}, 'path' : agg.params.nested.path}};
    }
    return filter;
  };

}
