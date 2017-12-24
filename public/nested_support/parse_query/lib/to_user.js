import _ from 'lodash';
import queryFormatter from './query_formatter';


/**
 * Take text from the model and present it to the user as a string
 * @param {text} model value
 * @returns {string}
 */
export function toUser(text) {
  if (text == null) return '';
  if (_.isObject(text)) {
    if (text.query_string) {
      return toUser(text.query_string.query);
    }
    try {
      var result = queryFormatter.formatQuery(text);
      if (result === undefined) {
        return JSON.stringify(text);
      }
      return result;
    } catch (e) {
      return JSON.stringify(text);
    }
  }
  return '' + text;
}

export function toUserIndexPattern(fieldMap) {
  queryFormatter.fieldDictionary = fieldMap;
}

