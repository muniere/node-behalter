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
 * Alias of Behalter#value.
 *
 * @param {string} name
 * @returns {*} value for name
 */
Behalter.prototype.get = function(name) {
  return this.value(name);
};

/**
 * Alias of Behalter#value.
 *
 * @param {(string|Object)} name
 * @param {Object} value
 * @returns {Behalter} this
 */
Behalter.prototype.set = function(name, value) {
  return this.value(name, value);
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

  // do not create instance with `new` to inherit getters and setters of self
  var child = Object.create(self);
  Behalter.call(child, self);

  if (arguments.length === 0) {
    return child;
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

  self.value(name, child);

  return child;
};

/**
 * Create a new independent behalter.
 *
 * @returns {Behalter} new behalter
 */
Behalter.prototype.forge = function() {
  return new Behalter();
};

/**
 * Execute a function with Behalter as `this`.
 *
 * @param {function} fn
 * @param {Array=} args
 * @return {*} return value of fn
 */
Behalter.prototype.apply = function(fn, args) {

  if (!_.isArray(args)) {
    throw new TypeError('Argument list has wrong type');
  }

  var self = this;

  if (!_.isFunction(fn)) {
    throw new Error('invalid arguments');
  }

  var names = annotate(fn);
  var merged = _.map(names, function(name) {
    return self.value(name) || self.factory(name) || args.shift();
  });

  return fn.apply(self, merged);
};

/**
 * Execute a function with Behalter as `this`.
 *
 * @param {function} fn
 * @param {*...=} params
 * @return {*} return value of fn
 */
Behalter.prototype.call =
Behalter.prototype.exec = function(fn, params) {

  var self = this;

  if (!_.isFunction(fn)) {
    throw new Error('invalid arguments');
  }

  var names = annotate(fn);
  var runtime = Array.prototype.slice.call(arguments, 1);
  var merged = _.map(names, function(name) {
    return self.value(name) || self.factory(name) || runtime.shift();
  });

  return fn.apply(self, merged);
};

/**
 * Execute a function with Behalter as `this`.
 *
 * @param {function} fn
 * @param {*...=} props
 * @return {*} return value of fn
 */
Behalter.prototype.callp =
Behalter.prototype.execp = function(fn, props) {

  var self = this;

  if (!_.isFunction(fn) || !_.isObject(props)) {
    throw new Error('invalid arguments');
  }

  var names = annotate(fn);
  var merged = _.map(names, function(name) {
    return props[name] || self.value(name) || self.factory(name);
  });

  return fn.apply(self, merged);
};

/**
 * Install module into behalter.
 *
 * @param {function|Object} mod
 * @param {*...=} params
 * @return {Behalter} this
 */
Behalter.prototype.install = function(mod, params) {

  var self = this;

  var args = Array.prototype.slice.call(arguments, 1);
  if (_.isFunction(mod)) {
    mod.apply(self, args);
  } else if (_.isFunction(mod.install)) {
    mod.install.apply(self, args);
  }

  return self;
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

/**
 * Extract names of arguments for function.
 *
 * @param {function} fn
 * @returns {string[]} names of arguments
 */
function annotate(fn) {
  var matched = /function +[^\(]*\(([^\)]*)\).*/.exec(fn.toString());
  var names = _.reject(matched[1].split(',') || [], _.isEmpty);

  return _.map(names, function(name) {
    return name.replace(/\s+/g, '');
  });
}

module.exports = Behalter;
