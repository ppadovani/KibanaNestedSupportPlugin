import {resolve} from 'path';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'nested-fields-support',
    uiExports: {

      docViews: ['plugins/nested-fields-support/nested_support/doc_view/structure'],

      managementSections: [
        'plugins/nested-fields-support/index_pattern/management',
        'plugins/nested-fields-support/discover/management'
      ],

      hacks: [
        'plugins/nested-fields-support/nested_support'
      ]


    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        index: Joi.string().default('.kibana')
      }).default();
    },


    // Update the .kibana index-pattern type to include a new nested flag
    init(server, options) {
      const {callWithInternalUser} = server.plugins.elasticsearch.getCluster('admin');

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
          const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
          callWithRequest(req, 'indices.getMapping', {
            index: req.params.name
          }).then(function (response) {
            reply(response);
          });
        }
      });
    }

  });
};
