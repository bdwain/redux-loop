'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.install = install;

var _utils = require('./utils');

var _errors = require('./errors');

var _loop = require('./loop');

var _effects = require('./effects');

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
function install() {
  return function (next) {
    return function (reducer, initialState, enhancer) {
      var currentEffect = (0, _effects.none)();

      var _liftState = (0, _loop.liftState)(initialState);

      var _liftState2 = _slicedToArray(_liftState, 2);

      var initialModel = _liftState2[0];
      var initialEffect = _liftState2[1];


      var liftReducer = function liftReducer(reducer) {
        return function (state, action) {
          var result = reducer(state, action);

          var _liftState3 = (0, _loop.liftState)(result);

          var _liftState4 = _slicedToArray(_liftState3, 2);

          var model = _liftState4[0];
          var effect = _liftState4[1];

          currentEffect = effect;
          return model;
        };
      };

      var store = next(liftReducer(reducer), initialModel, enhancer);

      var runEffect = function runEffect(originalAction, effect) {
        return (0, _effects.effectToPromise)(effect).then(function (actions) {
          return Promise.all(actions.map(dispatch));
        })['catch'](function (error) {
          console.error((0, _errors.loopPromiseCaughtError)(originalAction.type));
          throw error;
        });
      };

      var dispatch = function dispatch(action) {
        store.dispatch(action);
        var effectToRun = currentEffect;
        currentEffect = (0, _effects.none)();
        return runEffect(action, effectToRun);
      };

      var replaceReducer = function replaceReducer(reducer) {
        return store.replaceReducer(liftReducer(reducer));
      };

      runEffect({ type: '@@ReduxLoop/INIT' }, initialEffect);

      return _extends({}, store, {
        dispatch: dispatch,
        replaceReducer: replaceReducer
      });
    };
  };
}