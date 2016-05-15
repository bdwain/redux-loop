'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEffect = exports.getModel = exports.liftState = exports.isLoop = exports.loop = exports.install = exports.Effects = exports.combineReducers = undefined;

var _loop = require('./loop');

var _effects = require('./effects');

var _install = require('./install');

var _combineReducers = require('./combineReducers');

var Effects = {
  constant: _effects.constant,
  promise: _effects.promise,
  call: _effects.call,
  batch: _effects.batch,
  none: _effects.none,
  lift: _effects.lift
};

exports.combineReducers = _combineReducers.combineReducers;
exports.Effects = Effects;
exports.install = _install.install;
exports.loop = _loop.loop;
exports.isLoop = _loop.isLoop;
exports.liftState = _loop.liftState;
exports.getModel = _loop.getModel;
exports.getEffect = _loop.getEffect;