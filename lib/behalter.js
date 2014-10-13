'use strict';

var _ = require('lodash');

/**
 * Create a new behalter.
 * @param {Behalter=} parent
 * @constructor
 */
function Behalter(parent) {
  this.__parent = parent;
  this.__values = {};
  this.__factories = {};
}

/**
 * Set or get value.
 *
 * @param {(string|Object)} name
 * @param {Object=} value
 * @returns {*} value for name or this
 */
Behalter.prototype.value = function(name, value) {

  var self = this;

  if (reserved(name)) {
    throw new Error(name + ' is a reserved word');
  }

  // setter(bulk)
  if (_.isObject(name)) {
    _.each(name, function(v, k) {
      self.value(k, v);
    });

    return self;
  }

  // setter
  if (arguments.length === 2 && _.isString(name)) {
    self.__values[name] = value;
    self.__defineGetter__(name, function() {
      return this.value(name);
    });
    self.__defineSetter__(name, function() {
    });
    return self;
  }

  // getter
  if (arguments.length === 1 && _.isString(name)) {
    var val = self.__values[name];
    if (val) {
      return val;
    } else if (self.__parent) {
      return self.__parent.value(name);
    } else {
      return undefined;
    }
  }

  throw new Error('invalid arguments');
};

/**
 * Set factory function or get returned value.
 *
 * @param {(string|Object)} name
 * @param {function=} factory
 * @returns {*} created value for name or this
 */
Behalter.prototype.factory = function(name, factory) {

  var self = this;

  if (reserved(name)) {
    throw new Error(name + ' is a reserved word');
  }

  // setter(bulk)
  if (_.isObject(name)) {
    _.each(name, function(v, k) {
      self.factory(k, v);
    });

    return self;
  }

  // setter
  if (arguments.length === 2 && _.isString(name)) {
    self.__factories[name] = factory;
    self.__defineGetter__(name, function() {
      return this.factory(name);
    });
    self.__defineSetter__(name, function() {
    });
    return self;
  }

  // getter
  if (arguments.length === 1 && _.isString(name)) {
    var fact = self.__factories[name];
    if (_.isFunction(fact)) {
      return fact();
    } else if (self.__parent) {
      return self.__parent.factory(name);
    } else {
      return undefined;
    }
  }

  throw new Error('invalid arguments');
};

/**
 * Get parent behalter.
 *
 * @returns {Behalter} parent behalter
 */
Behalter.prototype.parent = function() {
  return this.__parent;
};

/**
 * Get root behalter.
 *
 * @returns {Behalter} root behalter
 */
Behalter.prototype.root = function() {
  if (this.__parent) {
    return this.__parent.root();
  } else {
    return this;
  }
};

/**
 * Create and get a new child behalter.
 *
 * @param {string=} name
 * @returns {Behalter} child behalter
 */
Behalter.prototype.child = function(name) {

  var self = this;

  if (arguments.length === 0) {
    return new Behalter(self);
  }

  if (!_.isString(name)) {
    throw new Error('invalid arguments');
  }
  if (reserved(name)) {
    throw new Error(name + ' is reserved word');
  }

  var val = self.value(name);
  if (val instanceof Behalter) {
    return val;
  } else if (val) {
    throw new Error('value for name ' + name + ' is already defined');
  }

  self.value(name, new Behalter(self));

  return self.value(name);
};

/**
 * Create a new independent behalter.
 *
 * @returns {Behalter} new behalter
 */
Behalter.prototype.forge = function() {
  return new Behalter();
};

// =====================================
// Helpers
// =====================================

var RESERVED = _.keys(Behalter.prototype);

/**
 * Judge if name is reserved word or not.
 *
 * @param {string} name
 * @returns {boolean} true if reserved
 */
function reserved(name) {
  if (!_.isString(name)) {
    return false;
  }

  return _.contains(RESERVED, name);
}

module.exports = Behalter;
