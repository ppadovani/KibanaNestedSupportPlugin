import { SourceAbstract } from 'ui/courier/data_source/_abstract';

SourceAbstract.prototype._flatten = function () {
  const type = this._getType();

  // the merged state of this dataSource and it's ancestors
  const flatState = {};

  // function used to write each property from each state object in the chain to flat state
  const root = this;

  // start the chain at this source
  let current = this;

  // call the ittr and return it's promise
  return (function ittr() {
    // itterate the _state object (not array) and
    // pass each key:value pair to source._mergeProp. if _mergeProp
    // returns a promise, then wait for it to complete and call _mergeProp again
    return Promise.all(_.map(current._state, function ittr(value, key) {
      if (Promise.is(value)) {
        return value.then(function (value) {
          return ittr(value, key);
        });
      }

      const prom = root._mergeProp(flatState, value, key);
      return Promise.is(prom) ? prom : null;
    }))
      .then(function () {
        // move to this sources parent
        const parent = current.getParent();
        // keep calling until we reach the top parent
        if (parent) {
          current = parent;
          return ittr();
        }
      });
  }())
    .then(function () {
      if (type === 'search') {
        // This is down here to prevent the circular dependency
        const decorateQuery = Private(DecorateQueryProvider);

        flatState.body = flatState.body || {};

        // defaults for the query
        if (!flatState.body.query) {
          flatState.body.query = {
            'match_all': {}
          };
        }

        if (flatState.body.size > 0) {
          const computedFields = flatState.index.getComputedFields();
          flatState.body.stored_fields = computedFields.storedFields;
          flatState.body.script_fields = flatState.body.script_fields || {};
          flatState.body.docvalue_fields = flatState.body.docvalue_fields || [];

          _.extend(flatState.body.script_fields, computedFields.scriptFields);
          flatState.body.docvalue_fields = _.union(flatState.body.docvalue_fields, computedFields.docvalueFields);

          if (flatState.body._source) {
            // exclude source fields for this index pattern specified by the user
            const filter = fieldWildcardFilter(flatState.body._source.excludes);
            flatState.body.docvalue_fields = flatState.body.docvalue_fields.filter(filter);
          }
        }

        decorateQuery(flatState.body.query);

        /**
         * Create a filter that can be reversed for filters with negate set
         * @param {boolean} reverse This will reverse the filter. If true then
         *                          anything where negate is set will come
         *                          through otherwise it will filter out
         * @returns {function}
         */
        const filterNegate = function (reverse) {
          return function (filter) {
            if (_.isUndefined(filter.meta) || _.isUndefined(filter.meta.negate)) return !reverse;
            return filter.meta && filter.meta.negate === reverse;
          };
        };

        /**
         * Translate a filter into a query to support es 3+
         * @param  {Object} filter - The filter to translate
         * @return {Object} the query version of that filter
         */
        const translateToQuery = function (filter) {
          if (!filter) return;

          if (filter.query) {
            return filter.query;
          }

          return filter;
        };

        /**
         * Clean out any invalid attributes from the filters
         * @param {object} filter The filter to clean
         * @returns {object}
         */
        const cleanFilter = function (filter) {
          return _.omit(filter, ['meta']);
        };

        // switch to filtered query if there are filters
        if (flatState.filters) {
          if (flatState.filters.length) {
            _.each(flatState.filters, function (filter) {
              if (filter.query) {
                decorateQuery(filter.query);
              }
            });

            if (!flatState.index.nestedPath) {
              flatState.body.query = {
                bool: {
                  must: (
                    [flatState.body.query].concat(
                      (flatState.filters || [])
                        .filter(filterNegate(false))
                        .map(translateToQuery)
                        .map(cleanFilter)
                    )
                  ),
                  must_not: (
                    (flatState.filters || [])
                      .filter(filterNegate(true))
                      .map(translateToQuery)
                      .map(cleanFilter)
                  )
                }
              };
            } else {
              flatState.body.query = {
                nested: {
                  path: flatState.index.nestedPath,
                  query: {
                    bool: {
                      must: (
                        [flatState.body.query].concat(
                          (flatState.filters || [])
                            .filter(filterNegate(false))
                            .map(translateToQuery)
                            .map(cleanFilter)
                        )
                      ),
                      must_not: (
                        (flatState.filters || [])
                          .filter(filterNegate(true))
                          .map(translateToQuery)
                          .map(cleanFilter)
                      )
                    }
                  }
                }
              };
            }
          }
          delete flatState.filters;
        }

        if (flatState.highlightAll != null) {
          if (flatState.highlightAll && flatState.body.query) {
            flatState.body.highlight = getHighlightRequest(flatState.body.query);
          }
          delete flatState.highlightAll;
        }

        // re-write filters within filter aggregations
        (function recurse(aggBranch) {
          if (!aggBranch) return;
          Object.keys(aggBranch).forEach(function (id) {
            const agg = aggBranch[id];

            if (agg.filters) {
              // translate filters aggregations
              const filters = agg.filters.filters;

              Object.keys(filters).forEach(function (filterId) {
                filters[filterId] = translateToQuery(filters[filterId]);
              });
            }

            recurse(agg.aggs || agg.aggregations);
          });
        }(flatState.body.aggs || flatState.body.aggregations));
      }

      return flatState;
    });
};