import {uiModules} from 'ui/modules';
import noResultsTemplate from './query_bar.html';

uiModules
  .get('kibana')
  .config(function ($provide) {
    try {
      $provide.decorator('queryBarDirective', function ($delegate) {

        let directive = $delegate[0];
        directive.template = noResultsTemplate;
        directive.link = function Link($scope) {
          $scope.indexPattern = $scope.$parent.$parent.indexPattern;
        }
        // directive.scope.indexPattern = '=?';
        // const oldController = directive.controller;
        // directive.controller = function InitAfterBindingsWrapper($injector, $attrs, $element, $scope, $transclude) {
        //   $scope.indexPattern = $scope.$parent.$parent.indexPattern;
        //   return oldController($injector, $attrs, $element, $scope, $transclude);
        // };
        return $delegate;
      });
    } catch (e) {
      // do nothing as the provider isn't there when someone selects timelion
    }
  });