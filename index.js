import {resolve} from 'path';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'nested-fields-support',
    uiExports: {

      // app: {
      //   title: 'Nested Fields Support',
      //   description: 'An awesome Kibana plugin',
      //   main: 'plugins/nested-fields-support/app'
      // },


      // translations: [
      //   resolve(__dirname, './translations/es.json')
      // ],

      managementSections: [
        'plugins/nested-fields-support/index_pattern/management'
      ],

      hacks: [
        'plugins/nested-fields-support/hacks/index_pattern',
        'plugins/nested-fields-support/hacks/field',
        'plugins/nested-fields-support/hacks/parse_query/parse_query'
        // 'plugins/nested-fields-support/index_pattern/management/edit_sections'
      ]

      //mappings

    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        index: Joi.string().default('.kibana')
      }).default();
    },


    // Update the .kibana index-pattern type to include a new nested flag
    init(server, options) {
      const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');

      callWithInternalUser('indices.putMapping', {
        index: ".kibana",
        type: "index-pattern",
        body: {
          properties: {
            nested: {
              type: "boolean"
            }
          }
        }
      });

      server.route({
        path: '/api/nested-fields-support/mappings/{name}',
        method: 'GET',
        handler(req, reply) {
          callWithInternalUser('indices.getMapping', {
            index: req.params.name
          }).then(function (response) {
            reply(response);
          });
        }
      });
    }

  });
};
