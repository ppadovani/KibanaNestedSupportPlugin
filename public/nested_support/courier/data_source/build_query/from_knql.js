import _ from 'lodash';
import { luceneStringToDsl } from 'ui/courier/data_source/build_query/lucene_string_to_dsl';

export function buildQueryFromKnql(queries) {
  const combinedQueries = _.map(queries, (query) => {
    return luceneStringToDsl(query.query);
  });

  return {
    must: [].concat(combinedQueries),
    filter: [],
    should: [],
    must_not: [],
  };
}
