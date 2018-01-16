import {uiModules} from 'ui/modules';
import noResultsTemplate from './query_bar.html';

uiModules
  .get('kibana')
  .config(function ($provide) {
    try {
      $provide.decorator('queryBarDirective', function ($delegate) {

        let directive = $delegate[0];
        directive.template = noResultsTemplate;
        return $delegate;
      });
    } catch (e) {
      // do nothing as the provider isn't there when someone selects timelion
    }
  });