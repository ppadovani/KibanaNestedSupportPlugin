import { find } from 'lodash';

export function getPercentileValue(agg, bucket) {
  let valueBucket = bucket;
  if (bucket['nested_' + agg.parentId]) {
	  valueBucket = bucket['nested_' + agg.parentId];
  }
  const values = valueBucket[agg.parentId] && valueBucket[agg.parentId].values;
  const percentile = find(values, value => agg.key === value.key);
  return percentile ? percentile.value : NaN;
}
