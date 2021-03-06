import React, { Fragment } from 'react';
import _ from 'lodash';
import { SavedObjectNotFound, DuplicateField, IndexPatternMissingIndices } from 'ui/errors';
import angular from 'angular';
import { fieldFormats } from 'ui/registry/field_formats';
import UtilsMappingSetupProvider from 'ui/utils/mapping_setup';
import { Notifier, toastNotifications } from 'ui/notify';

import { getComputedFields } from 'ui/index_patterns/_get_computed_fields';
import { formatHit } from 'ui/index_patterns/_format_hit';
import { IndexPatternsGetProvider } from 'ui/index_patterns/_get';
import { IndexPatternsIntervalsProvider } from 'ui/index_patterns/_intervals';
import { FieldList } from 'ui/index_patterns/_field_list';
import { IndexPatternsFlattenHitProvider } from 'ui/index_patterns/_flatten_hit';
import { IndexPatternsPatternCacheProvider } from 'ui/index_patterns/_pattern_cache';
import { FieldsFetcherProvider } from 'ui/index_patterns/fields_fetcher_provider';
import { IsUserAwareOfUnsupportedTimePatternProvider } from 'ui/index_patterns/unsupported_time_patterns';
import { SavedObjectsClientProvider, findObjectByTitle } from 'ui/saved_objects';

import { nestedFormatHit } from './_format_hit';
import { IndexPatternsNestedFlattenHitProvider } from './_flatten_hit';
import * as indexPattern from 'ui/index_patterns/_index_pattern';
import { OldIndexPatternProvider } from 'ui/index_patterns/_index_pattern';

export function getRoutes() {
  return {
    edit: '/management/kibana/indices/{{id}}',
    addField: '/management/kibana/indices/{{id}}/create-field',
    indexedFields: '/management/kibana/indices/{{id}}?_a=(tab:indexedFields)',
    scriptedFields: '/management/kibana/indices/{{id}}?_a=(tab:scriptedFields)',
    sourceFilters: '/management/kibana/indices/{{id}}?_a=(tab:sourceFilters)'
  };
}

const MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS = 3;

indexPattern.IndexPatternProvider = function (Private, $http, config, kbnIndex, Promise, confirmModalPromise, kbnUrl) {

  const getConfig = (...args) => config.get(...args);
  const getIds = Private(IndexPatternsGetProvider)('id');
  const fieldsFetcher = Private(FieldsFetcherProvider);
  const intervals = Private(IndexPatternsIntervalsProvider);
  const mappingSetup = Private(UtilsMappingSetupProvider);
  const flattenHit = Private(IndexPatternsFlattenHitProvider);
  const nestedFlattenHit = Private(IndexPatternsNestedFlattenHitProvider);
  const patternCache = Private(IndexPatternsPatternCacheProvider);
  const isUserAwareOfUnsupportedTimePattern = Private(IsUserAwareOfUnsupportedTimePatternProvider);
  const savedObjectsClient = Private(SavedObjectsClientProvider);
  const fieldformats = fieldFormats;

  const type = 'index-pattern';
  const notify = new Notifier();
  const configWatchers = new WeakMap();

  const mapping = mappingSetup.expandShorthand({
    title: 'text',
    timeFieldName: 'keyword',
    intervalName: 'keyword',
    nested: 'boolean',
    fields: 'json',
    sourceFilters: 'json',
    fieldFormatMap: {
      type: 'text',
      _serialize(map = {}) {
        const serialized = _.transform(map, serializeFieldFormatMap);
        return _.isEmpty(serialized) ? undefined : angular.toJson(serialized);
      },
      _deserialize(map = '{}') {
        return _.mapValues(angular.fromJson(map), deserializeFieldFormatMap);
      }
    }
  });

  function serializeFieldFormatMap(flat, format, field) {
    if (format) {
      flat[field] = format;
    }
  }

  function deserializeFieldFormatMap(mapping) {
    const FieldFormat = fieldformats.byId[mapping.id];
    return FieldFormat && new FieldFormat(mapping.params, getConfig);
  }

  function updateFromElasticSearch(indexPattern, response, forceFieldRefresh = false) {
    if (!response.found) {
      throw new SavedObjectNotFound(
        type,
        indexPattern.id,
        '#/management/kibana/index',
      );
    }

    _.forOwn(mapping, (fieldMapping, name) => {
      if (!fieldMapping._deserialize) {
        return;
      }
      response._source[name] = fieldMapping._deserialize(response._source[name]);
    });

    // give index pattern all of the values in _source
    _.assign(indexPattern, response._source);

    if (!indexPattern.title) {
      indexPattern.title = indexPattern.id;
    }

    if (indexPattern.isUnsupportedTimePattern()) {
      if (!isUserAwareOfUnsupportedTimePattern(indexPattern)) {
        toastNotifications.addWarning({
          title: 'Support for time intervals was removed',
          text: (
            <Fragment>
              For more information, view the {' '}
              <a href={kbnUrl.getRouteHref(indexPattern, 'edit')}>{indexPattern.title} index pattern</a>
            </Fragment>
          ),
        });
      }
    }

    if (!indexPattern.nested) {
      indexPattern.nested = false;
    } else {
      indexPattern.activateNested();
    }
    return indexFields(indexPattern, forceFieldRefresh);
  }

  function sortRecursive(array, propertyName) {

    _.forEach(array, function (item) {
      if (item.fields) {
        item.fields = sortRecursive(item.fields, propertyName);
      }
    });

    return _.sortBy(array, propertyName).reverse();
  }


  function isFieldRefreshRequired(indexPattern) {
    if (!indexPattern.fields) {
      return true;
    }

    return indexPattern.fields.every(field => {
      // See https://github.com/elastic/kibana/pull/8421
      const hasFieldCaps = ('aggregatable' in field) && ('searchable' in field);

      // See https://github.com/elastic/kibana/pull/11969
      const hasDocValuesFlag = ('readFromDocValues' in field);

      return !hasFieldCaps || !hasDocValuesFlag;
    });
  }

  function indexFields(indexPattern, forceFieldRefresh = false) {
    let promise = Promise.resolve();

    if (!indexPattern.id) {
      return promise;
    }

    if (forceFieldRefresh || isFieldRefreshRequired(indexPattern)) {
      promise = indexPattern.refreshFields();
    }

    return promise.then(() => {
      initFields(indexPattern);
    });
  }

  function setId(indexPattern, id) {
    indexPattern.id = id;
    return id;
  }

  function setVersion(indexPattern, version) {
    indexPattern.version = version;
    return version;
  }

  function watch(indexPattern) {
    if (configWatchers.has(indexPattern)) {
      return;
    }
    const unwatch = config.watchAll(() => {
      if (indexPattern.fields) {
        initFields(indexPattern); // re-init fields when config changes, but only if we already had fields
      }
    });
    configWatchers.set(indexPattern, { unwatch });
  }

  function unwatch(indexPattern) {
    if (!configWatchers.has(indexPattern)) {
      return;
    }
    configWatchers.get(indexPattern).unwatch();
    configWatchers.delete(indexPattern);
  }

  function initFields(indexPattern, input) {
    const oldValue = indexPattern.fields;
    const newValue = input || oldValue || [];
    indexPattern.fields = new FieldList(indexPattern, newValue);
  }

  function fetchFields(indexPattern) {
    return Promise.resolve()
    .then(() => fieldsFetcher.fetch(indexPattern))
    .then(fields => {
      const scripted = indexPattern.getScriptedFields();
      const all = fields.concat(scripted);
      initFields(indexPattern, all);
    });
  }

  class IndexPattern {
    constructor(id) {
      setId(this, id);
      this.metaFields = config.get('metaFields');
      this.getComputedFields = getComputedFields.bind(this);

      this._legacyFlattenHit = this.flattenHit = flattenHit(this);
      this._legacyFormatHit = this.formatHit = formatHit(this, fieldFormats.getDefaultInstance('string'));
      this._legacyFormatField = this.formatField = this.formatHit.formatField;

      this.nestedFlattenHit = nestedFlattenHit(this);
      this.nestedFormatHit = nestedFormatHit(this, fieldFormats.getDefaultInstance('string'));
      this.nestedFormatField = this.nestedFormatHit.formatField;
      this.displayPriorityFieldOrder = [];
    }

    get routes() {
      return getRoutes();
    }

    init(forceFieldRefresh = false) {
      watch(this);

      if (!this.id) {
        return Promise.resolve(this); // no id === no elasticsearch document
      }

      return savedObjectsClient.get(type, this.id)
        .then(resp => {
          // temporary compatability for savedObjectsClient

          setVersion(this, resp._version);

          return {
            _id: resp.id,
            _type: resp.type,
            _source: _.cloneDeep(resp.attributes),
            found: resp._version ? true : false
          };
        })
        // Do this before we attempt to update from ES
        // since that call can potentially perform a save
        .then(response => {
          this.originalBody = this.prepBody();
          return response;
        })
        .then(response => updateFromElasticSearch(this, response, forceFieldRefresh))
        // Do it after to ensure we have the most up to date information
        .then(() => {
          this.originalBody = this.prepBody();
        })
        .then(() => this);
    }

    getDisplayPriorityFieldOrder() {
      return this.computeDisplayPriorityFieldOrder();
    }

    insertNestedIntoDisplayPriorityFieldOrderMap(fieldMap, field) {
      let paths = field.nestedPath.split('.');
      let pathCount;
      let lastFieldMapEntry = undefined;
      for (pathCount = 0; pathCount < paths.length; pathCount ++) {
        if (pathCount === 0) {
          if (fieldMap[paths[0]] === undefined) {
            fieldMap[paths[0]] = {
              name: paths[0],
              displayPriority: -1,
              fields: {}
            };
          }
          lastFieldMapEntry = fieldMap[paths[0]];
        } else if (lastFieldMapEntry[paths[pathCount]] === undefined) {
          lastFieldMapEntry[paths[pathCount]] = {
            name: paths[0],
            displayPriority: -1,
            fields: {}
          };
          lastFieldMapEntry = lastFieldMapEntry[paths[pathCount]];
        }
        lastFieldMapEntry[paths[pathCount]].fields[field.name] = {
          name: field.name,
          displayPriority: field.displayPriority
        };
        fieldMap[paths[0]].displayPriority = Math.max(fieldMap[paths[0]].displayPriority, field.displayPriority);
      }
    }

    buildDisplayPriorityFieldOrderMap() {
      let fieldMap = {};
      _.forEach(this.fields, function (field) {
        if (field.nestedPath !== undefined) {
          const paths = field.nestedPath.split('.');
          let pathCount;
          let lastFieldMapEntry = undefined;
          for (pathCount = 0; pathCount < paths.length; pathCount ++) {
            if (pathCount === 0) {
              if (fieldMap[paths[0]] === undefined) {
                fieldMap[paths[0]] = {
                  name: paths[0],
                  displayPriority: -1,
                  fields: {}
                };
              }
              lastFieldMapEntry = fieldMap[paths[0]];
            } else {
              if (lastFieldMapEntry.fields[paths[pathCount]] === undefined) {
                lastFieldMapEntry.fields[paths[pathCount]] = {
                  name: paths[pathCount],
                  displayPriority: -1,
                  fields: {}
                };
              }
              lastFieldMapEntry = lastFieldMapEntry.fields[paths[pathCount]];
              lastFieldMapEntry.displayPriority = Math.max(lastFieldMapEntry.displayPriority, field.displayPriority);
            }
            if (pathCount === paths.length - 1) {
              lastFieldMapEntry.fields[field.name] = {
                name: field.name,
                displayPriority: field.displayPriority
              };
              fieldMap[paths[0]].displayPriority = Math.max(fieldMap[paths[0]].displayPriority, field.displayPriority);
            }
          }
        } else {
          fieldMap[field.name] = {
            name: field.name,
            displayPriority: field.displayPriority
          };
        }
      });
      return fieldMap;
    }


    computeDisplayPriorityFieldOrder() {
      const fieldMap = this.buildDisplayPriorityFieldOrderMap();

      const sortedFields = sortRecursive(fieldMap, 'displayPriority').filter(function (obj) {
        return obj.displayPriority >= 0;
      });

      return sortedFields;
    }

    // Get the source filtering configuration for that index.
    getSourceFiltering() {
      return {
        excludes: this.sourceFilters && this.sourceFilters.map(filter => filter.value) || []
      };
    }

    addScriptedField(name, script, type = 'string', lang) {
      const scriptedFields = this.getScriptedFields();
      const names = _.pluck(scriptedFields, 'name');

      if (_.contains(names, name)) {
        throw new DuplicateField(name);
      }

      this.fields.push({
        name: name,
        script: script,
        type: type,
        scripted: true,
        lang: lang
      });

      this.save();
    }

    removeScriptedField(name) {
      const fieldIndex = _.findIndex(this.fields, {
        name: name,
        scripted: true
      });

      if(fieldIndex > -1) {
        this.fields.splice(fieldIndex, 1);
        delete this.fieldFormatMap[name];
        return this.save();
      }
    }

    activateNested() {
      this.nested = true;
      this.flattenHit = this.nestedFlattenHit;
      this.formatHit = this.nestedFormatHit;
      this.formatField = this.nestedFormatField;
    }

    deactivateNested() {
      this.nested = false;
      this.flattenHit = this._legacyFlattenHit;
      this.formatHit = this._legacyFormatHit;
      this.formatField = this._legacyFormatField;
    }

    popularizeField(fieldName, unit = 1) {
      const field = _.get(this, ['fields', 'byName', fieldName]);
      if (!field) {
        return;
      }
      const count = Math.max((field.count || 0) + unit, 0);
      if (field.count === count) {
        return;
      }
      field.count = count;
      this.save();
    }

    getNonScriptedFields() {
      return _.filter(this.fields, { scripted: false });
    }

    getScriptedFields() {
      return _.filter(this.fields, { scripted: true });
    }

    getInterval() {
      return this.intervalName && _.find(intervals, { name: this.intervalName });
    }

    toIndexList(start, stop, sortDirection) {
      return this
        .toDetailedIndexList(start, stop, sortDirection)
        .then(detailedIndices => {
          if (!Array.isArray(detailedIndices)) {
            return detailedIndices.index;
          }
          return detailedIndices.map(({ index }) => index).join(',');
        });
    }

    toDetailedIndexList(start, stop, sortDirection) {
      return Promise.resolve().then(() => {
        if (this.isTimeBasedInterval()) {
          return intervals.toIndexList(
            this.title, this.getInterval(), start, stop, sortDirection
          );
        }

        return [
          {
            index: this.title,
            min: -Infinity,
            max: Infinity
          }
        ];
      });
    }

    isTimeBased() {
      return !!this.timeFieldName && (!this.fields || !!this.getTimeField());
    }

    isTimeBasedInterval() {
      return this.isTimeBased() && !!this.getInterval();
    }

    isUnsupportedTimePattern() {
      return !!this.intervalName;
    }

    isTimeBasedWildcard() {
      return this.isTimeBased() && this.isWildcard();
    }

    getTimeField() {
      if (!this.timeFieldName || !this.fields || !this.fields.byName) return;
      return this.fields.byName[this.timeFieldName];
    }

    isWildcard() {
      return _.includes(this.title, '*');
    }

    prepBody() {
      const body = {};

      // serialize json fields
      _.forOwn(mapping, (fieldMapping, fieldName) => {
        if (this[fieldName] != null) {
          body[fieldName] = (fieldMapping._serialize)
            ? fieldMapping._serialize(this[fieldName])
            : this[fieldName];
        }
      });

      // clear the indexPattern list cache
      getIds.clearCache();
      return body;
    }

    async create(allowOverride = false, showOverridePrompt = false) {
      const _create = async (duplicateId) => {
        if (duplicateId) {
          const duplicatePattern = new IndexPattern(duplicateId);
          await duplicatePattern.destroy();
    }

        const body = this.prepBody();
        const response = await savedObjectsClient.create(type, body, { id: this.id });
        return setId(this, response.id);
      };

      const potentialDuplicateByTitle = await findObjectByTitle(savedObjectsClient, type, this.title);
      // If there is potentially duplicate title, just create it
      if (!potentialDuplicateByTitle) {
        return await _create();
      }

      // We found a duplicate but we aren't allowing override, show the warn modal
      if (!allowOverride) {
        const confirmMessage = `An index pattern with the title '${this.title}' already exists.`;
        try {
          await confirmModalPromise(confirmMessage, { confirmButtonText: 'Go to existing pattern' });
          return kbnUrl.redirect('/management/kibana/indices/{{id}}', { id: potentialDuplicateByTitle.id });
        } catch (err) {
          return false;
        }
      }

      // We can override, but we do not want to see a prompt, so just do it
      if (!showOverridePrompt) {
        return await _create(potentialDuplicateByTitle.id);
      }

      // We can override and we want to prompt for confirmation
      try {
        await confirmModalPromise(`Are you sure you want to overwrite ${this.title}?`, { confirmButtonText: 'Overwrite' });
      } catch (err) {
        // They changed their mind
        return false;
      }

      // Let's do it!
      return await _create(potentialDuplicateByTitle.id);
    }

    save(saveAttempts = 0) {
      const body = this.prepBody();
      // What keys changed since they last pulled the index pattern
      const originalChangedKeys = Object.keys(body).filter(key => body[key] !== this.originalBody[key]);
      return savedObjectsClient.update(type, this.id, body, { version: this.version })
        .then(({ id, _version }) => {
          setId(this, id);
          setVersion(this, _version);
        })
          .catch(err => {
          if (_.get(err, 'res.status') === 409 && saveAttempts++ < MAX_ATTEMPTS_TO_RESOLVE_CONFLICTS) {
            const samePattern = new IndexPattern(this.id);
            return samePattern.init()
              .then(() => {
                // What keys changed from now and what the server returned
                const updatedBody = samePattern.prepBody();

                // Build a list of changed keys from the server response
                // and ensure we ignore the key if the server response
                // is the same as the original response (since that is expected
                // if we made a change in that key)
                const serverChangedKeys = Object.keys(updatedBody).filter(key => {
                  return updatedBody[key] !== body[key] && this.originalBody[key] !== updatedBody[key];
                });

                let unresolvedCollision = false;
                for (const originalKey of originalChangedKeys) {
                  for (const serverKey of serverChangedKeys) {
                    if (originalKey === serverKey) {
                      unresolvedCollision = true;
                      break;
            }
                  }
                }

                if (unresolvedCollision) {
                  toastNotifications.addDanger('Unable to write index pattern! Refresh the page to get the most up to date changes for this index pattern.'); // eslint-disable-line max-len
                  throw err;
                }

                // Set the updated response on this object
                serverChangedKeys.forEach(key => {
                  this[key] = samePattern[key];
          });

                setVersion(this, samePattern.version);

                // Clear cache
                patternCache.clear(this.id);

                // Try the save again
                return this.save(saveAttempts);
      });
    }
          throw err;
        });
    }

    refreshFields() {
      return fetchFields(this)
      .then(() => this.save())
      .catch((err) => {
        notify.error(err);
        // https://github.com/elastic/kibana/issues/9224
        // This call will attempt to remap fields from the matching
        // ES index which may not actually exist. In that scenario,
        // we still want to notify the user that there is a problem
        // but we do not want to potentially make any pages unusable
        // so do not rethrow the error here
        if (err instanceof IndexPatternMissingIndices) {
          return [];
        }

        throw err;
      });
    }

    toJSON() {
      return this.id;
    }

    toString() {
      return '' + this.toJSON();
    }

    destroy() {
      unwatch(this);
      patternCache.clear(this.id);
      return savedObjectsClient.delete(type, this.id);
    }
  }

  return IndexPattern;
}
