import { AggConfigs } from 'ui/vis/agg_configs';

AggConfigs.prototype.toDsl = function () {
  const dslTopLvl = {};
  let dslLvlCursor = dslTopLvl; // start at the top level;
  let nestedMetrics;
  let prevNestedPath;

  if (this.vis.isHierarchical()) {
    // collect all metrics, and filter out the ones that we won't be copying
    nestedMetrics = _(this.vis.aggs.bySchemaGroup.metrics)
      .filter(function (agg) {
        return agg.type.name !== 'count';
      })
      .map(function (agg) {
        return {
          config: agg,
          dsl: agg.toDsl()
        };
      })
      .value();
  }
  this.getRequestAggs()
    .filter(function (config) {
      return !config.type.hasNoDsl;
    })
    .forEach(function nestEachConfig(config, i, list) {
      let reverseNested = false;
      let nestedPath = (config.params.field ? config.params.field.nestedPath : undefined);
      let dsl;

      if (config.params.filters) {
        config.params.filters.forEach(function findNestedPath(filter) {
          if (filter.input.query.nested) {
            nestedPath = filter.input.query.nested.path;
          }
        });
      }

      if (prevNestedPath !== undefined) {
        if (nestedPath === undefined || (nestedPath !== prevNestedPath && prevNestedPath.startsWith(nestedPath))) {
          reverseNested = true;
        }
      }

      if (nestedPath !== undefined) {
        if (nestedPath === prevNestedPath) {
          nestedPath = undefined;
        } else {
          prevNestedPath = nestedPath;
        }
      }
      dsl = config.toDslNested(dslLvlCursor, nestedPath, reverseNested);

      let subAggs;

      parseParentAggs(dslLvlCursor, dsl);

      if (config.schema.group === 'buckets' && i < list.length - 1) {
        // buckets that are not the last item in the list accept sub-aggs
        subAggs = dsl.aggs || (dsl.aggs = {});
      }

      if (subAggs && nestedMetrics) {
        nestedMetrics.forEach(function (agg) {
          if (typeof agg === AggConfig) {
            agg.toDslNested(subAggs);
          } else {
            subAggs[agg.config.id] = agg.dsl;
          }
        });
      } else {
        if (dsl.aggs === undefined) {
          prevNestedPath = undefined;
        }
      }

    });

  removeParentAggs(dslTopLvl);
  return dslTopLvl;
};
