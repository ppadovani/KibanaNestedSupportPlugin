import _ from 'lodash';
import angular from 'angular';
define(function (require) {
  let _ = require('lodash');
  let angular = require('angular');
  let queryFormatter = require('ui/parse_query/lib/query_formatter');

/**
 * Take text from the model and present it to the user as a string
 * @param {text} model value
 * @returns {string}
 */
  function toUser(text) {
    if (text == null) return '';
    if (_.isObject(text)) {
      if (text.query_string) {
        return toUser(text.query_string.query);
      }
      try {
        var result = queryFormatter.formatQuery(text);
        if (result === undefined) {
          return angular.toJson(text);
        }
        return result;
      } catch (e) {
        return angular.toJson(text);
      }
    }
    return '' + text;
  };

  toUser.setIndexPattern = function (fieldMap) {
    queryFormatter.fieldDictionary = fieldMap;
  };

  return toUser;
});
