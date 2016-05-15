"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var loopPromiseCaughtError = exports.loopPromiseCaughtError = function loopPromiseCaughtError(originalActionType) {
  return "\nloop Promise caught when returned from action of type " + originalActionType + ".\nloop Promises must not throw!\n\nDid you forget to do one of the following?\n\n- Call `.catch` on a Promise in a function passed to `Effects.promise`\n\n  const asyncEffect = (val) => {\n    return api.doStuff(val)\n      .then((stuff) => Actions.success(stuff))\n      .catch((error) => Actions.failure(error)); // <-- You have to do this!\n  };\n\n- Return an action from a `.catch` callback\n\n  const asyncEffect = (val) => {\n    return api.doStuff(val)\n      .then((stuff) => {\n        return Actions.success(stuff); // <-- Make sure to return here!\n      })\n      .catch((error) => {\n        return Actions.failure(error): // <-- And return here!\n      });\n  };\n\nDon't see the problem here? Please report the issue at <https://github.com/raisemarketplace/redux-loop/issues/new>\n";
};