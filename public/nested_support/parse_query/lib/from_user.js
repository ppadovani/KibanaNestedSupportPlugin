import _ from 'lodash';
import jison from 'jison';
import { DecorateQueryProvider } from 'ui/courier/data_source/_decorate_query';

let bnf = require('raw!./query_lang.jison');
let ngModel;
let parser = new jison.Parser(bnf, {
  type: 'slr',
  noDefaultResolve: true,
  moduleType: 'js'
});
parser.yy = require('./query_adapter');

/**
 * Take text from the user and make it into a query object
 * @param {text} user's query input
 * @returns {object}
 */
export function fromUser(text, model) {

  function getDefaultQuery() {
    return { match_all: {} };
  }

  function getTextQuery(query) {
    return {
      query_string: { query }
    };
  }

  let matchAll = getDefaultQuery();
  if (model !== undefined) {
    ngModel = model;
  }

  ngModel.parseError = undefined;
  // If we get an empty object, treat it as a *
  if (_.isObject(text)) {
    if (Object.keys(text).length) {
      return text;
    } else {
      return matchAll;
    }
  }

  // Nope, not an object.
  text = (text || '').trim();
  if (text.length === 0) return matchAll;

  if (text[0] === '{') {
    try {
      return JSON.parse(text);
    } catch (e) {
      return getQueryStringQuery(text);
    }
  } else {
    if (ngModel.$parent.indexPattern.nested) {
      try {
        if (ngModel.filter) {
          ngModel.filter.base_query = text;
        }
        let parsed = parser.parse(text).toJson();
        return JSON.parse(parsed);
      } catch (e) {
        ngModel.parseError = e.message;
        return undefined;
      }
    }
    return getTextQuery(text);
  }
}

export function fromUserIndexPattern(fieldMap) {
  parser.yy.fieldDictionary = fieldMap;
}



