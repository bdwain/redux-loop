'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.effectToPromise = effectToPromise;
exports.isEffect = isEffect;
exports.none = none;
exports.promise = promise;
exports.call = call;
exports.batch = batch;
exports.constant = constant;
exports.lift = lift;

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isEffectSymbol = Symbol('isEffect');

var effectTypes = {
  PROMISE: 'PROMISE',
  CALL: 'CALL',
  BATCH: 'BATCH',
  CONSTANT: 'CONSTANT',
  NONE: 'NONE',
  LIFT: 'LIFT'
};

/**
* Runs an effect and returns the Promise for its completion.
* @param {Object} effect The effect to convert to a Promise.
* @returns {Promise} The converted effect Promise.
*/
function effectToPromise(effect) {
  if (process.env.NODE_ENV === 'development') {
    (0, _utils.throwInvariant)(isEffect(effect), 'Given effect is not an effect instance.');
  }

  switch (effect.type) {
    case effectTypes.PROMISE:
      return effect.factory.apply(effect, _toConsumableArray(effect.args)).then(function (action) {
        return [action];
      });
    case effectTypes.CALL:
      return Promise.resolve([effect.factory.apply(effect, _toConsumableArray(effect.args))]);
    case effectTypes.BATCH:
      return Promise.all(effect.effects.map(effectToPromise)).then(_utils.flatten);
    case effectTypes.CONSTANT:
      return Promise.resolve([effect.action]);
    case effectTypes.NONE:
      return Promise.resolve([]);
    case effectTypes.LIFT:
      return effectToPromise(effect.effect).then(function (actions) {
        return actions.map(function (action) {
          return effect.factory.apply(effect, _toConsumableArray(effect.args).concat([action]));
        });
      });
  }
}

/**
 * Determines if the object was created with an effect creator.
 * @param {Object} object The object to inspect.
 * @returns {Boolean} Whether the object is an effect.
 */
function isEffect(object) {
  return object ? object[isEffectSymbol] : false;
}

/**
 * Creates a noop effect.
 * @returns {Object} An effect of type NONE, essentially a no-op.
 */
function none() {
  return _defineProperty({
    type: effectTypes.NONE
  }, isEffectSymbol, true);
}

/**
 * Creates an effect for a function that returns a Promise.
 * @param {Function} factory The function to invoke with the given args that returns a Promise for an action.
 * @returns {Object} The wrapped effect of type PROMISE.
 */
function promise(factory) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return _defineProperty({
    factory: factory,
    args: args,
    type: effectTypes.PROMISE
  }, isEffectSymbol, true);
}

/**
 * Creates an effect for a function that returns an action.
 * @param {Function} factory The function to invoke with the given args that returns an action.
 * @returns {Object} The wrapped effect of type CALL.
 */
function call(factory) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  return _defineProperty({
    factory: factory,
    args: args,
    type: effectTypes.CALL
  }, isEffectSymbol, true);
}

/**
 * Composes an array of effects together.
 */
function batch(effects) {
  return _defineProperty({
    effects: effects,
    type: effectTypes.BATCH
  }, isEffectSymbol, true);
}

/**
 * Creates an effect for an already-available action.
 */
function constant(action) {
  return _defineProperty({
    action: action,
    type: effectTypes.CONSTANT
  }, isEffectSymbol, true);
}

/**
 * Transform the return type of a bunch of `Effects`. This is primarily useful for adding tags to route `Actions` to the right place
 */
function lift(effect, factory) {
  for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    args[_key3 - 2] = arguments[_key3];
  }

  return _defineProperty({
    effect: effect,
    factory: factory,
    args: args,
    type: effectTypes.LIFT
  }, isEffectSymbol, true);
}