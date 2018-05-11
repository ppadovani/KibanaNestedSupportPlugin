import _ from 'lodash';
import { noWhiteSpace } from './no_white_space';
import { toJson } from 'src/core_plugins/kibana/common/utils/aggressive_parse';
import { FieldFormat } from 'src/ui/field_formats/field_format';
import { createSourceFormat } from 'src/core_plugins/kibana/common/field_formats/types/source';
import {RegistryFieldFormatsProvider} from 'ui/registry/field_formats';
import { uiModules } from 'ui/modules';
import nestedSrcTmpl from './_nested_source.html';

const templateHtml = `
  <dl class="source truncate-by-height">
    <% defPairs.forEach(function (def) { %>
      <dt><%- def[0] %>:</dt>
      <dd><%= def[1] %></dd>
      <%= ' ' %>
    <% }); %>
  </dl>`;

let app = uiModules.get('kibana/courier');
const nestedTemplate = _.template(noWhiteSpace(nestedSrcTmpl));
const template = _.template(noWhiteSpace(templateHtml));

app.run(function(config, Private) {
  const fieldformats = Private(RegistryFieldFormatsProvider);

  const SourceFormat = fieldformats.getType("_source");
  
  if (SourceFormat) {
    function genNested(sortedFields, highlights, formattedValue, nestedKeyPath) {
      let nestedObj = '';
      _.forEach(formattedValue, function(item) {
        if (nestedObj.length > 0) {
          nestedObj += ', ';
        }
        nestedObj += '&#123;';
        const sourcePairs = [];
        const highlightPairs = [];
        _.forEach(sortedFields, function (sortedField) {
          //Build up the nested path each time genNested is called
          const key = (sortedField.name.startsWith(nestedKeyPath) ? sortedField.name : nestedKeyPath + '.' + sortedField.name);
          if (item[key] && sortedField.displayPriority >= 0) {
            const pairs = highlights[key] ? highlightPairs : sourcePairs;
            const field = key;
            const val = _.isArray(item[key]) ? genNested(sortedField.fields, highlights, item[key], key) : item[key];
            pairs.push([field, val]);
          }
        }, []);

        nestedObj += nestedTemplate({ defPairs: highlightPairs.concat(sourcePairs) });
        nestedObj += '&#125;';
      });
      return nestedObj;
    }

    SourceFormat.prototype._convert = {
      text: (value) => toJson(value),
      html: function sourceToHtml(source, field, hit) {
        if (!field) return this.getConverterFor('text')(source, field, hit);

        // create a list of fields sorted by priority from the indexPattern
        const sortedFields = field.indexPattern.getDisplayPriorityFieldOrder();

        const highlights = (hit && hit.highlight) || {};
        const formatted = field.indexPattern.formatHit(hit, true);
        const highlightPairs = [];
        const sourcePairs = [];

        _.forEach(sortedFields, function (sortedField) {
          const key = sortedField.name;
          if (formatted[key]) {
            const pairs = highlights[key] ? highlightPairs : sourcePairs;
            const field = key;
            const val = _.isArray(formatted[key]) ? genNested(sortedField.fields, highlights, formatted[key], key) : formatted[key];
            pairs.push([field, val]);
          }
        }, []);

        return template({ defPairs: highlightPairs.concat(sourcePairs) });
      }
    }
  }
});
