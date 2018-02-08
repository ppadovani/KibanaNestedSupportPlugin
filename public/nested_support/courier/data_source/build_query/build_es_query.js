import { groupBy, has } from 'lodash';
import { DecorateQueryProvider } from 'ui/courier/data_source/_decorate_query';
import { buildQueryFromKuery, buildQueryFromKql } from 'ui/courier/data_source/build_query/from_kuery';
import { buildQueryFromFilters } from 'ui/courier/data_source/build_query/from_filters';
import { buildQueryFromLucene } from 'ui/courier/data_source/build_query/from_lucene';
import { buildQueryFromKnql } from './from_knql';

import * as buildQuery from 'ui/courier/data_source/build_query/build_es_query';

buildQuery.BuildESQueryProvider = function(Private) {
  const decorateQuery = Private(DecorateQueryProvider);

  /**
   *
   * @param queries - an array of query objects. Each query has a language property and a query property.
   * @param filters - an array of filter objects
   */
  function buildESQuery(indexPattern, queries = [], filters = []) {
    const validQueries = queries.filter((query) => has(query, 'query'));
    const queriesByLanguage = groupBy(validQueries, 'language');

    const kueryQuery = buildQueryFromKuery(indexPattern, queriesByLanguage.kuery);
    const kqlQuery = buildQueryFromKql(indexPattern, queriesByLanguage.kql);
    const luceneQuery = buildQueryFromLucene(queriesByLanguage.lucene, decorateQuery);
    const filterQuery = buildQueryFromFilters(filters, decorateQuery);
    const knqlQuery = buildQueryFromKnql(queriesByLanguage.knql);

    return {
      bool: {
        must: [].concat(kueryQuery.must, kqlQuery.must, luceneQuery.must, filterQuery.must, knqlQuery.must),
        filter: [].concat(kueryQuery.filter, kqlQuery.filter, luceneQuery.filter, filterQuery.filter, knqlQuery.filter),
        should: [].concat(kueryQuery.should, kqlQuery.should, luceneQuery.should, filterQuery.should, knqlQuery.should),
        must_not: [].concat(kueryQuery.must_not, kqlQuery.must_not, luceneQuery.must_not, filterQuery.must_not, knqlQuery.must_not),
      }
    };
  }

  return buildESQuery;
}
