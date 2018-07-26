import _ from 'lodash';
import {DecorateQueryProvider} from 'ui/courier/data_source/_decorate_query';
import {parser} from './knql';

let ngModel;
parser.yy = require('./knql_adapter');


function getDescription(fieldName) {
  return `<p>Filter results that contain <span class="suggestionItem__callout">${escape(fieldName)}</span></p>`;
}

function getQueryBar($scope) {
  let queryBar = undefined;
  let curScope = $scope;
  while (queryBar === undefined && curScope) {
    curScope = curScope.$parent;
    if (curScope) {
      queryBar = curScope.queryBar;
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

  let query = undefined;
  const queryBar = getQueryBar(ngModel);
  if (queryBar !== undefined) {
    query = queryBar.query;
  }
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
    try {
      let parsed = parser.parse(text).toJson();
      ngModel.$parent.parseError = undefined;
      if (query !== undefined) {
        const cursorPos = ngModel.$parent.queryBarForm.$$element[0][0].selectionEnd;
        const start = text.substr(0, cursorPos).lastIndexOf(' ') + 1;
        const fieldPart = text.substr(text.substr(0, cursorPos).lastIndexOf(' ') + 1)
        query.suggestions = buildSuggestions(fieldPart, start, cursorPos);
        query.parseError = undefined;
        query.parsed = JSON.parse(parsed);
        query.query = text;
        return text;
      }
      if (ngModel.filter) {
        ngModel.filter.base_query = text;
        return JSON.parse(parsed);
      }
    } catch (e) {
      if (query !== undefined) {
        query.suggestions = buildSuggestions(fieldPart, start, cursorPos, e.message);
        query.parseError = e.message;
        query.query = text;
      }
      ngModel.$parent.parseError = e.message;
      return undefined;
    }
  }
}

function buildErrorMsg(fieldPart, msg, start, end) {
  const type="parseError";
  const description = '<pre>' + msg + '</pre>';
  const text = fieldPart;
  return {type, text, description, start, end};
}

function buildSuggestions(fieldPart, start, end, errMsg) {
  const type='field';

  var suggestions = [];

  // if (errMsg) {
  //   suggestions.push(buildErrorMsg(fieldPart, errMsg, start, end));
  // }

  if (parser.yy.possibleFields[fieldPart]) {
    suggestions.concat(parser.yy.possibleFields[fieldPart].map(field => {
      const text = field.name;
      const description = getDescription(field.name);
      return {type, text, description, start, end};
    }));
  }
  return suggestions;
}

export function fromUserIndexPattern(fieldMap) {
  parser.yy.fieldDictionary = fieldMap;
}



