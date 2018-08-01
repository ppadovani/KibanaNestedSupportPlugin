import template from './query_bar.html';
import {compact, get} from 'lodash';
import {uiModules} from 'ui/modules';
import {callAfterBindingsWorkaround} from 'ui/compat';
import suggestionTemplate from 'ui/query_bar/directive/suggestion.html';
import {getSuggestionsProvider} from 'ui/kuery';
import 'ui/query_bar/directive/suggestion.less';
import './parseError.less';
import 'ui/directives/match_pairs';
import 'ui/query_bar/directive/query_popover';


const module = uiModules.get('kibana');

function getIndexPattern($scope) {
  let indexPattern = undefined;
  let curScope = $scope;
  while (indexPattern === undefined && curScope) {
    curScope = curScope.$parent;
    if (curScope) {
      indexPattern = curScope.indexPattern;
    }
  }
  return indexPattern;
}

// const kibanaModule = uiModules.get('kibana');
module.config(function ($provide) {
    try {
      $provide.decorator('queryBarDirective', function ($delegate) {

        let directive = $delegate[0];
        directive.template = template;
        directive.controller = callAfterBindingsWorkaround(function ($scope, $element, $http, $timeout, config, PersistedLog, indexPatterns) {
      this.appName = this.appName || 'global';

      this.indexPattern = getIndexPattern($scope);
      this.query.language = (this.indexPattern  && this.indexPattern.nested ? 'knql' :
          localStorage['kibana.userQueryLanguage'] ? localStorage['kibana.userQueryLanguage'].replace(/"/g, '')
              || config.get('search:queryLanguage') : config.get('search:queryLanguage'));

      if (this.query.language === 'knql') {
        this.query.parsed = undefined;
        this.query.suggestions = undefined;
        this.query.parseError = undefined;
      }

      this.getIndexPatterns = () => {
        if (compact(this.indexPatterns).length) return Promise.resolve(this.indexPatterns);
        return Promise.all([indexPatterns.getDefault()]);
      };

      this.submit = () => {
        if (this.localQuery.query) {
          this.persistedLog.add(this.localQuery.query);
        }
        this.onSubmit({ $query: this.localQuery });
        this.suggestions = [];
      };

      this.selectLanguage = (language) => {
        this.localQuery.language = language;
        this.localQuery.query = '';
        this.submit();
      };

      this.suggestionTemplate = suggestionTemplate;

      this.handleKeyDown = (event) => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          this.updateSuggestions();
        } else if (this.localQuery.language === 'knql') {
          this.updateSuggestions();
        }
      };

      this.updateSuggestions = () => {
        const query = get(this, 'localQuery.query');
        if (typeof query === 'undefined') return;

        this.suggestions = this.getRecentSearchSuggestions(query);
        if (this.localQuery.language === 'lucene'
            || (!this.getKuerySuggestions && this.localQuery.language !== 'knql')) return;

        if (this.localQuery.language === 'kuery') {
          const { selectionStart, selectionEnd } = $element.find('input')[0];
          this.getKuerySuggestions({ query, selectionStart, selectionEnd })
              .then(suggestions => {
                $scope.$apply(() => this.suggestions = [...suggestions, ...this.suggestions]);
              });
        } else if (this.localQuery.language === 'knql') {
          this.suggestions = this.suggestions.concat(this.localQuery.suggestions);
        }
      };

      // TODO: Figure out a better way to set selection
      this.onSuggestionSelect = ({ type, text, start, end }) => {
        const { query } = this.localQuery;
        const inputEl = $element.find('input')[0];
        const { selectionStart, selectionEnd } = inputEl;
        const value = query.substr(0, selectionStart) + query.substr(selectionEnd);

        this.localQuery.query = inputEl.value = value.substr(0, start) + text + value.substr(end);
        inputEl.setSelectionRange(start + text.length, start + text.length);

        if (type === 'recentSearch') {
          this.submit();
        } else {
          this.updateSuggestions();
        }
      };

      this.getRecentSearchSuggestions = (query) => {
        if (!this.persistedLog) {
          return undefined;
        }
        const recentSearches = this.persistedLog.get();
        const matchingRecentSearches = recentSearches.filter(search => {
          if (typeof search === 'string' || search instanceof String) {
            return search.includes(query);
          }
          return undefined;
        });
        return matchingRecentSearches.map(recentSearch => {
          const text = recentSearch;
          const start = 0;
          const end = query.length;
          return { type: 'recentSearch', text, start, end };
        });
      };

      $scope.$watch('queryBar.localQuery.language', (language) => {
        if (!language) return;
        this.persistedLog = new PersistedLog(`typeahead:${this.appName}-${language}`, {
          maxLength: config.get('history:limit'),
          filterDuplicates: true
        });
        this.updateSuggestions();
      });

      $scope.$watch('queryBar.query', (newQuery) => {
        this.localQuery = {
          ...newQuery
        };
        if (this.localQuery.language === 'kuery') {
          this.updateSuggestions();
        }
      }, true);

      $scope.$watch('queryBar.indexPatterns', () => {
        this.getIndexPatterns().then(indexPatterns => {
          if (this.localQuery.language === 'kuery') {
            this.getKuerySuggestions = getSuggestionsProvider({ $http, config, indexPatterns });
          }
          this.updateSuggestions();
        });
      });
    });
        return $delegate;
      });
    } catch (e) {
      // do nothing as the provider isn't there when someone selects timelion
    }
  });
