import _ from 'lodash';
import $ from 'jquery';
import * as parseQuery from 'ui/parse_query/parse_query';

parseQuery.getDefaultQuery = function () {
  alert('boo!');
  return { match_all: {} };
};

parseQuery.parseQuery = function (query) {
  alert('boo!');
  if (!_.isString(query) || query.trim() === '') {
    return parseQuery.getDefaultQuery();
  }

  try {
    const parsedQuery = JSON.parse(query);
    if (_.isObject(parsedQuery)) {
      return parsedQuery;
    }
    return getTextQuery(query);
  } catch (e) {
    return getTextQuery(query);
  }
};

function getTextQuery(query) {
  return {
    query_string: { query }
  };
}


$(document.body).on('keypress', function (event) {
  if (event.which === 58) {
    alert('boo!');
  }
});
