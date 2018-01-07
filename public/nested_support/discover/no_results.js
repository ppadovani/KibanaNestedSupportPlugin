import uiModules from 'ui/modules';
import noResultsTemplate from '../../discover/partials/no_results.html';

uiModules
  .get('apps/discover')
  .config(function ($provide) {
    try {
      $provide.decorator('discoverNoResultsDirective', function ($delegate) {

        let directive = $delegate[0];
        directive.template = noResultsTemplate;
        return $delegate;
      });
    } catch (e) {
      // do nothing as the provider isn't there when someone selects timelion
    }
  });