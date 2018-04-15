import _ from 'lodash';
import * as rangeDef from 'ui/filter_manager/lib/range';

const OPERANDS_IN_RANGE = 2;

rangeDef.buildRangeFilter = function(field, params, indexPattern, formattedValue) {
  const filter = { meta: { index: indexPattern.id } };
  if (formattedValue) filter.meta.formattedValue = formattedValue;

  params = _.mapValues(params, (value) => {
    return (field.type === 'number') ? parseFloat(value) : value;
  });

  if ('gte' in params && 'gt' in params) throw new Error('gte and gt are mutually exclusive');
  if ('lte' in params && 'lt' in params) throw new Error('lte and lt are mutually exclusive');

  const totalInfinite = ['gt', 'lt'].reduce((totalInfinite, op) => {
    const key = op in params ? op : `${op}e`;
    const isInfinite = Math.abs(params[key]) === Infinity;

    if (isInfinite) {
      totalInfinite++;
      delete params[key];
    }

    return totalInfinite;
  }, 0);

  if (totalInfinite === OPERANDS_IN_RANGE) {
    filter.match_all = {};
    filter.meta.field = field.name;
  } else if (field.scripted) {
    filter.script = getRangeScript(field, params);
    filter.meta.field = field.name;
  } else {
    // check for nested
    if (indexPattern.fields.byName[field.name].nestedPath) {
      filter.query = { nested : { path : indexPattern.fields.byName[field.name].nestedPath, query : { range : {}}}};
      filter.query.nested.query.range[field.name] = params;
    } else {
      filter.range = {};
      filter.range[field.name] = params;
    }
  }

  return filter;
};
