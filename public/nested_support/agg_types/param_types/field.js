import 'ui/courier';
import uiModules from 'ui/modules';
import AggTypesParamTypesFieldProvider from 'ui/agg_types/param_types/field';
import editorHtml from './field.html';

let app = uiModules.get('kibana/courier');

app.run(function(config, Private) {
  const FieldAggParam = Private(AggTypesParamTypesFieldProvider);
  FieldAggParam.prototype.editor = editorHtml;
});

