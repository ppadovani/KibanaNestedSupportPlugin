
let scope;

if (typeof require !== 'undefined') {
  scope = exports;
}

scope.fieldDictionary = {};

scope.moment = require('moment');
scope.errors = require('ui/errors');
scope._ = require('lodash');

/**
 * when a field mapping is requested for an unknown field
 * @param {String} name - the field name
 */
export class FieldNotFoundInSelectedIndex extends scope.errors.KbnError {
  constructor(name) {
    super('The ' + name + ' field was not found in the currently selected index',
      FieldNotFoundInSelectedIndex);
  }
}

/**
 * when a field mapping is requested for an unknown field
 * @param {String} name - the field name
 */
export class InvalidValueForField extends scope.errors.KbnError {
  constructor(name, type, value) {
    super('The ' + name + ' field expects a ' + type + ' but got ' + value,
      InvalidValueForField);
  }
}


function getMapping(fieldName) {
  if (scope.fieldDictionary) {
    let mapping = scope.fieldDictionary.byName[fieldName];
    if (mapping === undefined) {
      throw new FieldNotFoundInSelectedIndex(fieldName);
    }
    return mapping;
  }
  return undefined;
}

function validateValue(mapping, value) {
  let temp;
  if (mapping) {
    switch (mapping.type) {
      case 'string':
        if (!scope._.isString(value)) {
          throw new InvalidValueForField(mapping.name, mapping.type, value);
        }
        return value;
        break;
      case 'date':
        if (!value._isAMomentObject && !(value instanceof scope.DateExp)) {
          throw new InvalidValueForField(mapping.name, mapping.type, value);
        }
        if (value._isAMomentObject) {
          return value.valueOf();
        }
        return value.value;
        break;
      case 'ip':
        return '"' + value + '"';
        break;
      case 'number':
        if (!scope._.isNumber(value)) {
          throw new InvalidValueForField(mapping.name, mapping.type, value);
        }
        return value;
        break;
      case 'boolean':
        if (!scope._.isBoolean(value)) {
          throw new InvalidValueForField(mapping.name, mapping.type, value);
        }
        return value;
        break;
      case 'geo_point':
        // check that the string value is formatted as a geo point
        temp = value.split(',');
        if (parseFloat(temp[0]) === NaN || parseFloat(temp[1]) === NaN) {
          throw new InvalidValueForField(mapping.name, mapping.type, value);
        }
        return value;
        break;
    }
  }
  return value;
}


scope.NOVALUE = {};

scope.Query = function (expression) {
  this.expression = expression;
};

scope.Query.prototype = {
  toJson : function () {
    return this.expression.toJson();
  }
};

scope.MatchAll = function () {
};

scope.MatchAll.prototype = {
  toJson : function () {
    return '{ "match_all": {} }';
  }
};

scope.Missing = function (fieldName) {
  let mapping = getMapping(fieldName);
  this.fieldName = fieldName;
  this.nestedPath = (mapping ? mapping.nestedPath : undefined);
};

scope.Missing.prototype = {
  toJson : function () {
    return '{"filtered":{"filter":{"missing":{"field":"' + this.fieldName
        + '"}}}}';
  }
};

scope.SetLiteral = function (value) {
  this.set = [ value ];
};

scope.SetLiteral.prototype = {
  add : function (value) {
    this.set.push(value);
  }
};

scope.RangeLiteral = function (from, to, includeLower, includeUpper) {
  this.from = from;
  this.to = to;
  this.includeLower = includeLower;
  this.includeUpper = includeUpper;
};

scope.Range = function (field, rangeLiteral) {
  let mapping = getMapping(field);
  this.field = field;
  this.rangeLiteral = rangeLiteral;
};

scope.Range.prototype = {
  toJson : function () {
    return '{"range":{"' + this.field + '":{"from":' + this.rangeLiteral.from
        + ',"to":' + this.rangeLiteral.to + ',"include_lower":'
        + this.rangeLiteral.includeLower + ',"include_upper":'
        + this.rangeLiteral.includeUpper + '}}}';
  }
};

scope.Term = function (field, operation, value) {
  let mapping = getMapping(field);
  this.field = field;
  this.operation = operation;
  this.value = validateValue(mapping, value);
  this.nestedPath = (mapping ? mapping.nestedPath : undefined);
};

scope.DateExp = function (value, offset) {
  this.value = '"' + value + offset + '"';
};

scope.Term.prototype = {
  toJson : function (ignoreNested) {
    let jsonString = '';
    if (this.nestedPath) {
      jsonString = '{"nested":{"path":"' + this.nestedPath + '","query":{"bool":{"filter":';
    }
    switch (this.operation) {
      case '=':
        jsonString += '{"term":{"' + this.field + '":' + this.value + '}}';
        break;
      case '>':
        jsonString += '{"range":{"' + this.field + '":{"from":' + this.value
            + ',"to":null,"include_lower":false,"include_upper":true}}}';
        break;
      case '<':
        jsonString += '{"range":{"' + this.field + '":{"from":null,"to":' + this.value
            + ',"include_lower":true,"include_upper":false}}}';
        break;
      case '>=':
        jsonString += '{"range":{"' + this.field + '":{"from":' + this.value
            + ',"to":null,"include_lower":true,"include_upper":true}}}';
        break;
      case '<=':
        jsonString += '{"range":{"' + this.field + '":{"from":null,"to":' + this.value
            + ',"include_lower":true,"include_upper":true}}}';
        break;
      case '~=':
        jsonString += '{"wildcard":{"' + this.field + '":' + this.value + '}}';
        break;
      default:
        break;
    }
    if (this.nestedPath) {
      jsonString += '}}}}';
    }
    return jsonString;
  }
};

scope.BoolExpr = function () {
  this.andExpr = [];
  this.orExpr = [];
  this.nestedPath;
};

scope.BoolExpr.prototype = {

  sameNested : function (left, right) {
    if (left.nestedPath === undefined && right.nestedPath === undefined) {
      return true;
    }
    if (left.nestedPath && right.nestedPath && left.nestedPath === right.nestedPath) {
      if (left instanceof scope.ScopedExpr && left.exists === true) {
        return false;
      } else if (right instanceof scope.ScopedExpr && right.exists === true) {
        return false;
      } else if (left instanceof scope.Not && left.expression instanceof scope.ScopedExpr && left.expression.exists === true) {
        return false;
      } else if (right instanceof scope.Not && right.expression instanceof scope.ScopedExpr && right.expression.exists === true) {
        return false;
      }
      return true;
    }
    return false;
  },

  setAnd : function (andExprs) {
    this.andExpr = andExprs;
  },

  setOr : function (orExprs) {
    this.orExpr = orExprs;
  },

  and : function (left, right) {
    let newAnd;
    let newBool;
    // If neither side is a Bool/this object, this means this is the first
    // set of expressions to be AND/OR together
    if (left !== this && right !== this) {
      if (this.sameNested(left, right)) {
        this.nestedPath = left.nestedPath;
        left.nestedPath = undefined;
        right.nestedPath = undefined;
      }
      this.andExpr.unshift(right);
      this.andExpr.unshift(left);
      return;
    }
    if (left !== this) {
      newAnd = left;
    } else {
      newAnd = right;
    }

    if (this.sameNested(this, newAnd)) {
      newAnd.nestedPath = undefined;
      this.andExpr.unshift(newAnd);
    } else {
      // Create a new BoolExpr move our contents to the left side, put the newAnd to the right, and set it in
      // our and.
      newBool = new scope.BoolExpr();
      newBool.setAnd(this.andExpr);
      newBool.nestedPath = this.nestedPath;
      this.nestedPath = undefined;
      this.andExpr = [newAnd, newBool];
    }

  },

  or : function (left, right) {
    let newOr;
    let newBool;

    // If neither side is a Bool/this object, this means this is the first
    // set of expressions to be AND/OR together
    if (left !== this && right !== this) {
      if (this.sameNested(left, right)) {
        this.nestedPath = left.nestedPath;
        left.nestedPath = undefined;
        right.nestedPath = undefined;
      }
      this.orExpr.unshift(right);
      this.orExpr.unshift(left);
      return;
    }
    if (left !== this) {
      newOr = left;
    } else {
      newOr = right;
    }

    if (this.sameNested(this, newOr)) {
      newOr.nestedPath = undefined;
      this.orExpr.unshift(newOr);
    } else {
      // Create a new BoolExpr move our contents to the left side, put the newAnd to the right, and set it in
      // our and.
      newBool = new scope.BoolExpr();
      newBool.setOr(this.orExpr);
      newBool.nestedPath = this.nestedPath;
      this.nestedPath = undefined;
      this.orExpr = [newOr, newBool];
    }
  },

  toJson : function () {
    let json = '';
    let i;

    if (this.nestedPath) {
      json = '{"nested":{"path":"' + this.nestedPath + '","query":{"bool":{"filter":';
    }

    json += '{"bool":';

    if (this.andExpr.length > 0) {
      json += '{"must":[';
      for (i = 0; i < this.andExpr.length; i++) {
        if (i > 0) {
          json += ',';
        }
        if (this.andExpr[i].nestedPath === this.nestedPath) {
          this.andExpr[i].nestedPath = undefined;
        }
        json += this.andExpr[i].toJson();
      }
      json += ']';
      if (this.orExpr.length === 0) {
        json += '}';
      }
    }
    if (this.andExpr.length > 0 && this.orExpr.length > 0) {
      json += ',';
    }
    if (this.orExpr.length > 0) {
      if (this.andExpr.length === 0) {
        json += '{';
      }
      json += '"should":[';
      for (i = 0; i < this.orExpr.length; i++) {
        if (i > 0) {
          json += ',';
        }
        if (this.orExpr[i].nestedPath === this.nestedPath) {
          this.orExpr[i].nestedPath = undefined;
        }
        json += this.orExpr[i].toJson();
      }
      json += ']}';
    }
    json += '}';
    if (this.nestedPath) {
      json += '}}}}';
    }
    return json;
  }
};

scope.Not = function (expression) {
  this.expression = expression;
  this.nestedPath = expression.nestedPath;
  this.expression.nestedPath = undefined;
};

scope.Not.prototype = {
  toJson : function () {
    let json = this.expression.toJson();
    if (this.nestedPath) {
      json = '{"nested":{"path":"' + this.nestedPath + '","query":{"bool":{"filter":' + json + '}}}}';
    }
    json = '{"bool":{"must_not":' + json + '}}';
    return json;
  }
};

scope.ScopedExpr = function (expression) {
  this.expression = expression;
  this.nestedPath = expression.nestedPath;
  this.expression.nestedPath = undefined;
  this.exists = false;
};

scope.ScopedExpr.prototype = {

  toJson : function () {
    if (this.nestedPath) {
      return '{"nested":{"path":"' + this.nestedPath + '","query":{"bool":{"filter":' + this.expression.toJson() + '}}}}';
    }
    return this.expression.toJson();
  }
};
