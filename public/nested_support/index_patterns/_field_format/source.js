import _ from 'lodash';
import { noWhiteSpace } from 'ui/utils/no_white_space';
import { IndexPatternsFieldFormatProvider } from 'ui/index_patterns/_field_format/field_format';
import { stringifySource } from 'ui/stringify/types/source';
import { uiModules } from 'ui/modules';
import sourceTmpl from 'ui/stringify/types/_source.html';
import nestedSrcTmpl from './_nested_source.html';


let app = uiModules.get('kibana/courier');
const template = _.template(noWhiteSpace(sourceTmpl));
const nestedTemplate = _.template(noWhiteSpace(nestedSrcTmpl));

app.run(function(config, Private) {
  const Source = Private(stringifySource);

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

  Source.prototype._convert = {
    text: JSON.stringify(),
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
  };
});
