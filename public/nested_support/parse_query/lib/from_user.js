import _ from 'lodash';
import jison from 'jison-gho';
import {DecorateQueryProvider} from 'ui/courier/data_source/_decorate_query';

let bnf = require('raw-loader!./query_lang.jison');
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
  function getQueryStringQuery(text) {
    return DecorateQueryProvider({query_string: {query: text}});
  }

  parser.yy.possibleFields = {};
  let matchAll = getQueryStringQuery('*');
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
  if (text.length === 0) text = '*';

  if (text[0] === '{') {
    try {
      return JSON.parse(text);
    } catch (e) {
      return getQueryStringQuery(text);
    }
  } else {
    const cursorPos = ngModel.$parent.queryBarForm.$$element[0][0].selectionEnd;
    const fieldPart = text.substr(text.substr(0, cursorPos).lastIndexOf(' ') + 1)
    try {
      if (ngModel.filter) {
        ngModel.filter.base_query = text;
      }
      let parsed = parser.parse(text).toJson();
      ngModel.$parent.possibleFields = parser.yy.possibleFields[fieldPart];
      ngModel.$parent.parseError = undefined;
      return JSON.parse(parsed);
    } catch (e) {
      ngModel.$parent.possibleFields = parser.yy.possibleFields[fieldPart];
      ngModel.$parent.parseError = e.message;
      return undefined;
    }
  }
}

export function fromUserIndexPattern(fieldMap) {
  parser.yy.fieldDictionary = fieldMap;
}



