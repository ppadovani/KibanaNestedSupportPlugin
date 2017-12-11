import * as editSections from 'plugins/kibana/management/sections/indices/edit_index_pattern/edit_sections';

const oldProvider = editSections.IndicesEditSectionsProvider;
editSections.IndicesEditSectionsProvider = function () {
  return function (indexPattern) {
    let sections = oldProvider()(indexPattern);
    sections.push({
      title: 'nested',
      index: 'nestedConfiguration',
      index: 'nestedConfiguration',
      count: 0
    })
    return sections;
  }
}