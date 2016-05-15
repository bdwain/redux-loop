'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.liftState = exports.loop = exports.getModel = exports.getEffect = exports.isLoop = undefined;

var _utils = require('./utils');

var _effects = require('./effects');

/**
 * Determines if the object is an array created via `loop()`.
 */
var isLoop = exports.isLoop = function isLoop(array) {
  return Array.isArray(array) && array.length === 2 && (0, _effects.isEffect)(array[1]);
};

/**
 * Returns the effect from the loop if it is a loop, otherwise null
 */
var getEffect = exports.getEffect = function getEffect(loop) {
  if (!isLoop(loop)) {
    return null;
  }

  return loop[1];
};

/**
 * Returns the model from the loop if it is a loop, otherwise identity
 */
var getModel = exports.getModel = function getModel(loop) {
  if (!isLoop(loop)) {
    return loop;
  }

  return loop[0];
};

/**
 * Attaches an effect to the model.
 *
 *   function reducerWithSingleEffect(state, action) {
 *     // ...
 *     return loop(
 *       newState,
 *       fetchSomeStuff() // returns a promise
 *     );
 *   }
 *
 *   function reducerWithManyEffectsOneAsyncOneNot(state, action) {
 *     // ...
 *     return loop(
 *       newState,
 *       Promise.all([
 *         fetchSomeStuff(),
 *         Promise.resolve(someActionCreator())
 *       ])
 *     );
 *   }
 */
var loop = exports.loop = function loop(model, effect) {
  if (process.env.NODE_ENV === 'development') {
    (0, _utils.throwInvariant)((0, _effects.isEffect)(effect), 'Given effect is not an effect instance.');
  }

  return [model, effect];
};

/**
* Lifts a state to a looped state if it is not already.
*/
var liftState = exports.liftState = function liftState(state) {
  return isLoop(state) ? state : loop(state, (0, _effects.none)());
};