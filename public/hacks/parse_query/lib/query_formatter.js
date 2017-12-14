define(function () {
  let moment = require('moment');

  QueryFormatter.fieldDictionary = {};

  function QueryFormatter() {
  }

  QueryFormatter.formatQuery = function (jsonObject) {
    return fromQuery(jsonObject);
  };

  function fromQuery(query) {
    if (query.match_all) {
      return '*';
    } else if (query.nested) {
      if (query.nested.query.must_not) {
        return 'NOT EXISTS ' + fromQuery(query.nested.query.must_not);
      } else if (query.nested.query.bool && query.nested.query.bool.must_not) {
        return '(NOT EXISTS ' + fromQuery(query.nested.query.bool.must_not) + ')';
      }
      return 'EXISTS ' + fromQuery(query.nested.query);
    } else if (query.term) {
      return fromTerm(query.term);
    } else if (query.bool) {
      return fromBool(query.bool);
    } else if (query.range) {
      return fromRange(query.range);
    } else if (query.must_not) {
      return fromMustNot(query.must_not);
    } else if (query.filtered) {
      return fromFiltered(query.filtered);
    }

    throw 'Unable to reverse parse';
  }

  function fromFiltered(filtered) {
    if (filtered.filter.missing) {
      return filtered.filter.missing.field + ' IS NULL';
    }
  }

  function fromMustNot(mustNot) {
    return 'NOT ' + fromQuery(mustNot);
  }

  function fromTerm(term) {
    let keyNames = Object.keys(term);
    let value = valueToString(keyNames[0], term[keyNames[0]]);
    return keyNames[0] + '=' + value;
  }

  function fromRange(range) {
    let fieldName = Object.keys(range)[0];
    let rangeObj = range[fieldName];
    if (rangeObj.from) {
      if (rangeObj.to) {
        return fieldName + ' IN ' + (rangeObj.include_lower ? '(' : '[')
            + valueToString(fieldName, rangeObj.from) + ','
            + valueToString(fieldName, rangeObj.to)
            + (rangeObj.include_upper ? ')' : ']');
      }
      return fieldName + (rangeObj.include_lower ? '>=' : '>')
          + valueToString(fieldName, rangeObj.from);
    } else {
      return fieldName + (rangeObj.include_upper ? '<=' : '<')
          + valueToString(fieldName, rangeObj.to);
    }
  }

  function fromBool(bool) {
    let returnValue = '(';
    let mustUsed = false;
    let i;

    if (bool.must === undefined && bool.should === undefined) {
      return fromQuery(bool);
    }

    if (bool.must) {
      for (i = 0; i < bool.must.length; i++) {
        if (i > 0) {
          returnValue += ' AND ';
        }
        returnValue += fromQuery(bool.must[i]);
      }
      mustUsed = true;
    }

    if (bool.should) {
      /**
       * Special case, if all of the fieldNames in the should are the same, this
       * is really an IN clause
       */
      let isIn = false;
      if (bool.should.length > 1 && bool.should[0].term) {
        isIn = true;
        let fieldName = Object.keys(bool.should[0].term)[0];
        for (i = 1; i < bool.should.length; i++) {
          if (bool.should[i].term === undefined || fieldName !== Object.keys(bool.should[i].term)[0]) {
            isIn = false;
            break;
          }
        }
        if (isIn) {
          if (bool.must === undefined) {
            returnValue = '';
          }
          returnValue += fieldName + ' IN {';
          for (i = 0; i < bool.should.length; i++) {
            if (i > 0) {
              returnValue += ',';
            }
            returnValue += valueToString(fieldName,
                bool.should[i].term[fieldName]);
          }
          returnValue += '}';
          if (bool.must === undefined) {
            return returnValue;
          }
        }
      }
      if (!isIn) {
        for (i = 0; i < bool.should.length; i++) {
          if (i > 0 || mustUsed) {
            returnValue += ' OR ';
          }

          returnValue += fromQuery(bool.should[i]);
        }
      }
    }
    returnValue += ')';
    return returnValue;
  }

  function valueToString(name, value) {
    let field = QueryFormatter.fieldDictionary.byName[name];
    switch (field.type) {
      case 'date':
        if (/now/i.test(value)) {
          return value;
        }
        if (/\|\|/i.test(value)) {
          let parts = value.split('||');
          return moment(Number(parts[0])).utc().format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z||' + parts[1];
        }
        return moment(value).utc().format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
        break;
      case 'string':
        return '"' + value + '"';
        break;
      default:
        return value;
        break;
    }
  }
  return QueryFormatter;

});
