import {uiModules} from 'ui/modules';
import uiRoutes from 'ui/routes';
import template from './discover.html';


uiRoutes
    .addSetupWork(function setDiscoverTemplate(Private, Promise, $route) {
      const route = $route.routes['/discover/:id?'];
      route.template = template;
    })


