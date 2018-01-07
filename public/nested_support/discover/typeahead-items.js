import uiModules from 'ui/modules';
import noResultsTemplate from '../../discover/partials/typeahead-items.html';

uiModules
  .get('apps/discover')
  .config(function ($provide) {
    $provide.decorator('kbnTypeaheadItemsDirective', function ($delegate) {

      let directive = $delegate[0];
      directive.template = noResultsTemplate;
      return $delegate;
    });
  });