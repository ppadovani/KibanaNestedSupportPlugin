import _ from 'lodash';
import { luceneStringToDsl } from 'ui/courier/search_source/build_query/lucene_string_to_dsl';
import { fromUser } from '../../../parse_query/lib/from_user';

export function buildQueryFromKnql(queries) {
  const combinedQueries = _.map(queries, (query) => {
    if (query.parsed === undefined) {
      fromUser(query.query);
    }
    return luceneStringToDsl(query.parsed);
  });

  return {
    must: [].concat(combinedQueries),
    filter: [],
    should: [],
    must_not: [],
  };
}
