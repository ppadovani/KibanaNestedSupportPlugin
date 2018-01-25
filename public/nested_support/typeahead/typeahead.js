import {uiModules} from 'ui/modules';

uiModules
  .get('apps/discover')
  .config(function ($provide) {
    try {
      $provide.decorator('kbnTypeaheadDirective', function ($delegate) {

        let directive = $delegate[0];
        
        return $delegate;
      });
    } catch (e) {
      // do nothing it might not be loaded yet
    }
  });