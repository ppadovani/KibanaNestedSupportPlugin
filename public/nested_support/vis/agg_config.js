/**
 * @name AggConfig
 *
 * @description This class represents an aggregation, which is displayed in the left-hand nav of
 * the Visualize app.
 */

import _ from 'lodash';
import { uiModules } from 'ui/modules';
import { RegistryFieldFormatsProvider } from 'ui/registry/field_formats';
import { VisAggConfigProvider } from 'ui/vis/agg_config';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  const aggConfig = Private(VisAggConfigProvider);


  /**
   * Convert this aggConfig to its dsl syntax.
   *
   * Adds params and adhoc subaggs to a pojo, then returns it
   *
   * @param  {AggConfig} aggConfig - the config object to convert
   * @return {void|Object} - if the config has a dsl representation, it is
   *                         returned, else undefined is returned
   */
  aggConfig.prototype.toDsl = function (prevNestedPath) {
    if (this.type.hasNoDsl) return;

    if (this.params.orderAgg) {
      let reverseNested = false;
      let nestedPath = (this.params.orderAgg.params.field ? this.params.orderAgg.params.field.nestedPath : undefined);
      let dsl;

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
      this.params.orderAgg.nestedPath = nestedPath;
      this.params.orderAgg.reverseNested = reverseNested;
    }

    const output = this.write();

    const configDsl = {};
    configDsl[this.type.dslName || this.type.name] = output.params;

    // if the config requires subAggs, write them to the dsl as well
    if (this.subAggs && !output.subAggs) output.subAggs = this.subAggs;
    if (output.subAggs) {
      const subDslLvl = configDsl.aggs || (configDsl.aggs = {});
      output.subAggs.forEach(function nestAdhocSubAggs(subAggConfig) {
        let reverseNested = false;
        let nestedPath = (subAggConfig.params.field ? subAggConfig.params.field.nestedPath : undefined);
        let dsl;

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

        subAggConfig.toDslNested(subDslLvl, nestedPath, reverseNested);
      });
    }

    if (output.parentAggs) {
      const subDslLvl = configDsl.parentAggs || (configDsl.parentAggs = {});
      output.parentAggs.forEach(function nestAdhocSubAggs(subAggConfig) {
        subDslLvl[subAggConfig.id] = subAggConfig.toDsl();
      });
    }

    return configDsl;
  };


  /**
   * Convert this aggConfig to its dsl syntax, handling the case that the
   * config is nested. If it is not nested, this is equivalent to:
   * `destination[this.id] = this.toDsl()`. If it is nested, the value of
   * `destination['nested_' + this.id]` reflects the nested structure, and
   * the original dsl exists at `destination['nested_' + this.id][this.id]`.
   *
   * @param destination The destination object in which to emplace the DSL
   * under the appropriate key.
   * @returns {void|Object} The original result of `this.toDsl()`, regardless
   * of whether this aggregation is nested.
   */
  aggConfig.prototype.toDslNested = function (destination, nestedPath, reverseNested) {
    let id = this.id;
    let dsl = this.toDsl(nestedPath);
    let result = dsl; // save the original dsl to return later

    if (this.params.countByParent) {
      let countId = 'count_' + this.id;
      let aggsKey = 'aggs';
      let countAgg = {};
      if (dsl.aggs) {
        countAgg = dsl.aggs;
      }
      countAgg[countId] = {
        reverse_nested : {}
      };
      dsl[aggsKey] = countAgg;
    }

    if (nestedPath || reverseNested) {
      // save the current dsl as a sub-agg of the nested agg
      let aggs = {};
      aggs[id] = dsl;
      if (reverseNested) {
        let reverseNestedDsl = {};
        // when reverse nesting, the path is optional
        if (nestedPath) {
          reverseNestedDsl.path = nestedPath;
        }
        id = 'nested_' + this.id;
        dsl = {
          reverse_nested: reverseNestedDsl,
          aggs: aggs
        };
      } else if (nestedPath) {
        id = 'nested_' + this.id;
        dsl = {
          nested: {
            path: nestedPath
          },
          aggs: aggs
        };
      }
    }
    // apply the change to the destination
    destination[id] = dsl;
    return result;
  };

  aggConfig.prototype.getValue = function (id, bucket) {
    if (bucket['count_' + id]) {
      return this.type.getValue(this, bucket['count_' + id]);
    }
    return this.type.getValue(this, bucket);
  };

  aggConfig.prototype.createFilter = function (key) {
    if (!this.isFilterable()) {
      throw new TypeError('The "' + this.type.title + '" aggregation does not support filtering.');
    }

    const field = this.getField();
    const label = this.getFieldDisplayName();
    if (field && !field.filterable) {
      let message = 'The "' + label + '" field can not be used for filtering.';
      if (field.scripted) {
        message = 'The "' + label + '" field is scripted and can not be used for filtering.';
      }
      throw new TypeError(message);
    }

    const filter = this.type.createFilter(this, key);
    if (field.nested) {
      filter.query = {
        "nested" : {
          "path" : field.nestedPath,
          "query" : filter.query
        }
      }
    }
    return filter;
  };

})

