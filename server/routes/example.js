export default function (server) {

  server.route({
    path: '/api/nested-fields-support/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

}
