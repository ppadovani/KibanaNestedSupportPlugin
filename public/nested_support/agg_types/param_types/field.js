import 'ui/courier';
import { uiModules } from 'ui/modules';
import { FieldParamType } from 'ui/agg_types/param_types/field';
import editorHtml from '../controls/field.html';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  FieldParamType.prototype.editor = editorHtml;
});

