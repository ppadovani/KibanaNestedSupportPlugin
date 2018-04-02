import _ from 'lodash';
import chrome from 'ui/chrome';

// Takes a hit, merges it with any stored/scripted fields, and with the metaFields
// returns a formatted version

export function nestedFormatHit(indexPattern, defaultFormat) {

  function convert(hit, val, fieldName, recurse) {
    const field = indexPattern.fields.byName[fieldName];
    if (!field) {
      if (val.constructor === Array && recurse) {
        let pArr = [];
        _.forEach(val, function (item) {
          let pStore = {};
          _.forEach(item, function (val, fieldName) {
            pStore[fieldName] = convert(hit, val, fieldName, true);
          });
          pArr.push(pStore);
        });
        return pArr;
      } else {
        return defaultFormat.convert(val, 'html');
      }
    }
    const parsedUrl = {
      origin: window.location.origin,
      pathname: window.location.pathname,
      basePath: chrome.getBasePath(),
    };
    return field.format.getConverterFor('html')(val, field, hit, parsedUrl);
  }

  function formatHit(hit, recurse) {
    if (hit.$$_formatted && !recurse) return hit.$$_formatted;

    if (hit.$$_structured && recurse) return hit.$$_structured;

    // use and update the partial cache, but don't rewrite it. _source is stored in partials
    // but not $$_formatted
    const partials = (recurse ? hit.$$_partialStructured : hit.$$_partialFormatted) || (recurse ? hit.$$_partialStructured = {}: hit.$$_partialFormatted = {});
    const cache = (recurse ? hit.$$_structured = {} : hit.$$_formatted = {});

    _.forOwn(indexPattern.flattenHit(hit, false), function (val, fieldName) {
      // sync the formatted and partial cache
      // const formatted = partials[fieldName] == null ? convert(hit, val, fieldName) : partials[fieldName];
      const formatted = partials[fieldName] == null ? convert(hit, val, fieldName, recurse) : partials[fieldName];
      cache[fieldName] = partials[fieldName] = formatted;
    });

    return cache;
  }

  formatHit.formatField = function (hit, fieldName) {
    let partials = hit.$$_partialFormatted;
    if (partials && partials[fieldName] != null) {
      return partials[fieldName];
    }

    if (!partials) {
      partials = hit.$$_partialFormatted = {};
    }

    const val = fieldName === '_source' ? hit._source : indexPattern.flattenHit(hit, false)[fieldName];
    return partials[fieldName] = convert(hit, val, fieldName, false);
  };

  return formatHit;
}

