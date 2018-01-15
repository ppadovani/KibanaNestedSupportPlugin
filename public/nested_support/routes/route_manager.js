import { cloneDeep, defaultsDeep, wrap } from 'lodash';

import { wrapRouteWithPrep } from 'ui/routes/wrap_route_with_prep';
import { RouteSetupManager } from 'ui/routes/route_setup_manager';
import { parsePathToBreadcrumbs } from 'ui/routes/breadcrumbs';

import uiRoutes from 'ui/routes';

//
// uiRoutes.prototype.getWhen = function(path) {
//
//     for(var i in this.when) {
//       if (this.when[i][0] === path) {
//         return this.when[i][1];
//       }
//     }
//   }
