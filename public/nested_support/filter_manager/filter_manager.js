import _ from 'lodash';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { getPhraseScript } from 'ui/filter_manager/lib/phrase';
import * as filterMgr from 'ui/filter_manager/filter_manager';

// Adds a filter to a passed state
filterMgr.FilterManagerProvider = function(Private) {
  const queryFilter = Private(FilterBarQueryFilterProvider);
  const filterManager = {};

  filterManager.add = function (field, values, operation, index) {
    values = _.isArray(values) ? values : [values];
    const fieldName = _.isObject(field) ? field.name : field;
    const filters = _.flatten([queryFilter.getAppFilters()]);
    const newFilters = [];

    const negate = (operation === '-');

    // TODO: On array fields, negating does not negate the combination, rather all terms
    _.each(values, function (value) {
      let filter;
      const existing = _.find(filters, function (filter) {
        if (!filter) return;

        if (fieldName === '_exists_' && filter.exists) {
          return filter.exists.field === value;
        }

        if (_.has(filter, 'query.match')) {
          return filter.query.match[fieldName] && filter.query.match[fieldName].query === value;
        }

        if (filter.script) {
          return filter.meta.field === fieldName && filter.script.script.params.value === value;
        }
      });

      if (existing) {
        existing.meta.disabled = false;
        if (existing.meta.negate !== negate) {
          queryFilter.invertFilter(existing);
        }
        return;
      }

      switch (fieldName) {
        case '_exists_':
          filter = {
            meta: { negate, index },
            exists: {
              field: value
            }
          };
          break;
        default:
          if (field.scripted) {
            filter = {
              meta: { negate, index, field: fieldName },
              script: getPhraseScript(field, value)
            };
          } else {
            if (field.nestedPath !== undefined) {
              filter = { meta: { negate, index }, query: { nested: { path: field.nestedPath, query : { match: {} } } } };
              filter.query.nested.query.match[fieldName] = { query: value, type: 'phrase' };
            } else {
              filter = { meta: { negate, index }, query: { match: {} } };
              filter.query.match[fieldName] = { query: value, type: 'phrase' };
            }
          }

          break;
      }

      newFilters.push(filter);
    });

    return queryFilter.addFilters(newFilters);
  };

  return filterManager;
};
