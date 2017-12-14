import { toUser, toUserIndexPattern } from './lib/to_user';
import { fromUser, fromUserIndexPattern } from './lib/from_user';


import {uiModules} from 'ui/modules';

uiModules
  .get('kibana')
  .config(function ($provide) {
    $provide.decorator('parseQueryDirective', function ($delegate) {

      var directive, link;
      directive = $delegate[0];
      link = directive.link;
      directive.compile = function() {
        return function Link($scope, elem, attr, ngModel) {
          let init = function () {
            $scope.ngModel = fromUser($scope.ngModel, ($scope ? $scope.$parent : undefined));
          };

          let fieldMap;

          if ($scope.$parent.indexPattern) {
            fieldMap = $scope.$parent.indexPattern.fields;
          }

          toUserIndexPattern(fieldMap);
          fromUserIndexPattern(fieldMap);
          ngModel.$parsers.push(fromUser);
          ngModel.$formatters.push(toUser);

          init();

        };
      };
      return $delegate;

      // $delegate[0].link = function ($scope, elem, attr, ngModel) {
      //   let init = function () {
      //     $scope.ngModel = ParseQueryLibFromUserProvider($scope.ngModel, ($scope ? $scope.$parent : undefined));
      //   };
      //
      //   let fieldMap;
      //
      //   if ($scope.$parent.indexPattern) {
      //     fieldMap = $scope.$parent.indexPattern.fields;
      //   }
      //
      //   toUser.setIndexPattern(fieldMap);
      //   fromUser.setIndexPattern(fieldMap);
      //   ngModel.$parsers.push(ParseQueryLibFromUserProvider);
      //   ngModel.$formatters.push(toUser);
      //
      //   init();
      // };
      // return $delegate;
    });
  });
// .directive('parseQuery', function () {
//   // const fromUser = Private(ParseQueryLibFromUserProvider);
//
//   return {
//     restrict: 'A',
//     require: 'ngModel',
//     scope: {
//       'ngModel': '='
//     },
//     link: function ($scope, elem, attr, ngModel) {
//       let init = function () {
//         $scope.ngModel = ParseQueryLibFromUserProvider($scope.ngModel, ($scope ? $scope.$parent : undefined));
//       };
//
//       let fieldMap;
//
//       if ($scope.$parent.indexPattern) {
//         fieldMap = $scope.$parent.indexPattern.fields;
//       }
//
//       toUser.setIndexPattern(fieldMap);
//       fromUser.setIndexPattern(fieldMap);
//       ngModel.$parsers.push(ParseQueryLibFromUserProvider);
//       ngModel.$formatters.push(toUser);
//
//       init();
//     }
//   };
// });


// export function getDefaultQuery() {
//   return { match_all: {} };
// }
//
// export function isDefaultQuery(query) {
//   return _.isEqual(query, getDefaultQuery());
// }
//
// export function getTextQuery(query) {
//   return {
//     query_string: { query }
//   };
// }
//
// export function isTextQuery(query) {
//   return _.has(query, 'query_string');
// }
//
// export function getQueryText(query) {
//   return _.get(query, ['query_string', 'query']) || '';
// }
//
// export function parseQuery(query) {
//   if (!_.isString(query) || query.trim() === '') {
//     return getDefaultQuery();
//   }
//
//   try {
//     const parsedQuery = JSON.parse(query);
//     if (_.isObject(parsedQuery)) {
//       return parsedQuery;
//     }
//     return getTextQuery(query);
//   } catch (e) {
//     return getTextQuery(query);
//   }
// }
//
// export function formatQuery(query) {
//   if (query == null || isDefaultQuery(query)) {
//     return '';
//   } else if (isTextQuery(query)) {
//     return getQueryText(query);
//   } else if (_.isObject(query)) {
//     return angular.toJson(query);
//   }
//   return '' + query;
// }
