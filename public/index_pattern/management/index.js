import { management } from 'ui/management';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import uiRoutes from 'ui/routes';
import routes from 'ui/routes';
import 'plugins/nested-fields-support/index_pattern/management/nested';

const indexPatternsResolutions = {
  indexPatterns: function (Private) {
    const savedObjectsClient = Private(SavedObjectsClientProvider);

    return savedObjectsClient.find({
      type: 'index-pattern',
      fields: ['title','nested'],
      perPage: 10000
    }).then(response => response.savedObjects);
  }
};

uiRoutes
  .defaults(/management\/kibana\/nested_configuration/, {
    resolve: indexPatternsResolutions
  });

management
  .getSection('kibana')
  .register('nested_configuration', {
    display: 'Nested Fields',
    order: 5,
    url: '#/management/kibana/nested_configuration/',
    tooltip: 'Activate/Deactivate nested field support for an index pattern.'
  });

