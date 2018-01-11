import management from 'ui/management';
import uiRoutes from 'ui/routes';
import routes from 'ui/routes';
import 'plugins/nested-fields-support/index_pattern/management/nested';

function fetchPatterns(courier, $q) {
  // var promise = new Promise(function () {
  return courier.indexPatterns.getIds().then(function (ids) {
    var promiseArray = [];
    for (var id in ids) {
      promiseArray.push(courier.indexPatterns.get(ids[id]))
    }
    return $q.all(promiseArray);
  });
};

uiRoutes
    .defaults(/management\/kibana\/nested_configuration/, {
      resolve: {
        indexPatternIds: function (courier) {
          return courier.indexPatterns.getIds();
        },
        indexPatternList: function (courier, $q) {
          return fetchPatterns(courier, $q);
        }
      }
    })
;

management
    .getSection('kibana')
    .register('nested_configuration', {
      display: 'Nested Fields',
      order: 5,
      url: '#/management/kibana/nested_configuration/',
      tooltip: 'Activate/Deactivate nested field support for an index pattern.'
    });

