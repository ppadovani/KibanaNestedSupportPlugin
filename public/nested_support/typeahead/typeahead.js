import {uiModules} from 'ui/modules';
import template from './typeahead.html';

const typeahead = uiModules.get('kibana/typeahead');

typeahead.config(function ($provide) {
  try {
    $provide.decorator('kbnTypeaheadDirective', function ($delegate) {

      let directive = $delegate[0];
      directive.template = template;
      return $delegate;
    });
  } catch (e) {
    // do nothing as the provider isn't there when someone selects timelion
  }
});



