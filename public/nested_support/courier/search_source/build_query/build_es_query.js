import { groupBy, has } from 'lodash';
import { decorateQuery } from 'ui/courier/search_source/decorate_query';
import { buildQueryFromKuery, buildQueryFromKql } from 'ui/courier/search_source/build_query/from_kuery';
import { buildQueryFromFilters } from 'ui/courier/search_source/build_query/from_filters';
import { buildQueryFromLucene } from 'ui/courier/search_source/build_query/from_lucene';
import { buildQueryFromKnql } from './from_knql';

import * as buildQuery from 'ui/courier/search_source/build_query/build_es_query';

buildQuery.BuildESQueryProvider = function(Private, config) {

  /**
   *
   * @param queries - an array of query objects. Each query has a language property and a query property.
   * @param filters - an array of filter objects
   */
  function buildESQuery(indexPattern, queries = [], filters = []) {
    const validQueries = queries.filter((query) => has(query, 'query'));
    const queriesByLanguage = groupBy(validQueries, 'language');

    const kueryQuery = buildQueryFromKuery(indexPattern, indexPattern.nested ? [] : queriesByLanguage.kuery, config);
    const luceneQuery = buildQueryFromLucene(indexPattern.nested ? [] : queriesByLanguage.lucene, decorateQuery);
    const filterQuery = buildQueryFromFilters(filters, decorateQuery, indexPattern);
    const knqlQuery = buildQueryFromKnql(queriesByLanguage.knql);

    return {
      bool: {
        must: [].concat(kueryQuery.must, luceneQuery.must, filterQuery.must, knqlQuery.must),
        filter: [].concat(kueryQuery.filter, luceneQuery.filter, filterQuery.filter, knqlQuery.filter),
        should: [].concat(kueryQuery.should, luceneQuery.should, filterQuery.should, knqlQuery.should),
        must_not: [].concat(kueryQuery.must_not, luceneQuery.must_not, filterQuery.must_not, knqlQuery.must_not),
      }
    };
  }

  return buildESQuery;
};
