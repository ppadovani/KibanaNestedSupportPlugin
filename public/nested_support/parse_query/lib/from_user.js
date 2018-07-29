import _ from 'lodash';
import {DecorateQueryProvider} from 'ui/courier/data_source/_decorate_query';
import {parser} from './knql';

let ngModel;
parser.yy = require('./knql_adapter');

function getQueryBar($scope) {
  let queryBar = undefined;
  let curScope = $scope;
  while (queryBar === undefined && curScope) {
    curScope = curScope.$parent;
    if (curScope) {
      queryBar = curScope.queryBarForm;
    }
  }
  return queryBar;
}

/**
 * Take text from the user and make it into a query object
 * @param {text} user's query input
 * @returns {object}
 */
export function fromUser(text, model) {
  function getQueryStringQuery(text) {
    return DecorateQueryProvider({query_string: {query: text}});
  }

  parser.yy.possibleFields = [];
  let matchAll = getQueryStringQuery('*');
  if (model !== undefined) {
    ngModel = model;
  }

  ngModel.parseError = undefined;
  const queryBar = getQueryBar(ngModel);
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
    const cursorPos = queryBar ? queryBar.$$element[0][0].selectionEnd : 0;
    const fieldPart = queryBar ? text.substr(text.substr(0, cursorPos).lastIndexOf(' ') + 1) : undefined;
    try {
      const parsed = parser.parse(text).toJson();
      ngModel.$parent.parseError = undefined;
      ngModel.$parent.possibleFields = fieldPart ? parser.yy.possibleFields[fieldPart] : [];
      if (ngModel.filter) {
        ngModel.filter.base_query = text;
      }
      return JSON.parse(parsed);
    } catch (e) {
      if (queryBar) {
        ngModel.$parent.possibleFields = parser.yy.possibleFields[fieldPart];
      }
      ngModel.$parent.parseError = e.message;
      return undefined;
    }
  }
}

export function fromUserIndexPattern(fieldMap) {
  parser.yy.fieldDictionary = fieldMap;
}



