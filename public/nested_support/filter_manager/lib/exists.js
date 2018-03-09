import * as existsLib from 'ui/filter_manager/lib/exists';

existsLib.buildExistsFilter = function(field, indexPattern) {
  if (field.nestedPath) {
    return {
      meta: {
        index: indexPattern.id
      },
      nested: {
        path: field.nestedPath,
        query: {
          exists: {
            field: field.name
          }
        }
      }
    };
  }
  return {
    meta: {
      index: indexPattern.id
    },
    exists: {
      field: field.name
    }
  };
};
