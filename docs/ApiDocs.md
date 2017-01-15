# API Docs

* [`install()`](#install)
* [`loop(state, cmd)`](#loopstate-cmd-any-cmd)
* [`liftState(state)`](#liftstatestate-any-cmd)
* [`getModel(loop)`](#getmodelloop-any)
* [`getCmd(loop)`](#getcmdloop-cmd--null)
* [`isLoop(object)`](#isloop-object)
* [`Cmds`](#cmds)
  * [`Cmd.none()`](#cmdsnone)
  * [`Cmd.constant(action)`](#cmdsconstantaction)
  * [`Cmd.call(functionToRun, actionCreator, ...args)`](#cmdscallfunctiontorun-actioncreator-args)
  * [`Cmd.promise(functionToRun, resolveActionCreator, rejectActionCreator, ...args)`](#cmdspromisefunctiontorun-resolveactioncreator-rejectactioncreator-args)
  * [`Cmd.batch(cmds)`](#cmdsbatchcmds)
  * [`Cmd.sequence(cmds)`](#cmdssequencecmds)
  * [`Cmd.arbitrary(function, ...args)`](#cmdsarbitraryfunction-args)
  * [`Cmd.map(cmd, higherOrderActionCreator, [...additionalArgs])`](#cmdsmapcmd-higherorderactioncreator-additionalargs)
* [`combineReducers(reducersMap, [initialState, accessor, modifier])`](#combinereducersreducersmap-initialstate-accessor-modifier)

## `install`

#### Notes
`install` applies the store enhancer to Redux's `createStore`. You'll need to
apply it either independently or with `compose` to use redux-loop's features in
your store. redux-loop internally takes over your top level state's shape and
and then decorates `store.getState` in order to provide your app with the state
you are expecting. Due to the way enhancers are composed, you'll need to be
careful about the order in which `install` is applied. Research on how this
ordering affects other enhancers is still under way.


#### Examples
**Applied separately (no other enhancers):**

```js
import { createStore } from 'redux';
import { install } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const store = createStore(reducer, initialState, install());
```

**Applied with other enhancers:**
```js
import { createStore, compose, applyMiddleware } from 'redux';
import someMiddleware from 'some-middleware';
import installOther from 'other-enhancer';
import { install as installReduxLoop } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const enhancer = compose(
  installReduxLoop(),
  applyMiddleware(someMiddleware),
  installOther()
);

const store = createStore(reducer, initialState, enhancer);
```

## `loop(state, cmd): [any, Cmd]`

* `state: any` &ndash; the new store state, like you would normally return from
  a reducer.
* `cmd: Cmd` &ndash; a cmd to run once the current action has been
  dispatched, can be a result of any of the functions available under `Cmd`.
* returns an `Array` pair of the `state` and the `cmd`, to allow for easy
  destructuring as well as a predictable structure for other functionality.

#### Notes

`loop` enables you to run cmds as the result of a particular action being
dispatched. It links synchronous state transitions with expected async state
transitions. When you return a `loop` result from your reducer, the store knows
how to separate cmds from state so cmds are not stored in the state tree
with data.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

function reducer(state, action) {
  switch(action.type) {
    case 'FIRST':
      // This result is a loop. The new state will have its `first` property
      // set to true. As a result of receiving this result from the reducer,
      // the store will not only replace this part of the state with the new
      // state setting `first` to true, it will schedule the SECOND action to
      // run next.
      return loop(
        { ...state, first: true },
        Cmd.constant({ type: 'SECOND' })
      );

    case 'SECOND':
      // This result is not a loop, just a plain synchronous state transition.
      // Returning loops from a reducer is optional by branch. The store knows
      // how to examine results and compose cmds into a separate effect tree
      // from the state tree.
      return { ...state, second: true };
  }
}
```

## `liftState(state): [any, Cmd]`

* `state: any` &ndash; an object which may be the state of the redux store, or
  an existing `[any, Cmd]` pair created by `loop()`.

#### Notes

Automatically converts objects to `loop()` results. If the value was created
with `loop()`, then the function behaves as an identity. Otherwise, it is lifted
into a `[any, Cmd]` pair where the effect is `Cmd.none()`. Useful for
forcing reducers to always return a `loop()` result, even if they shortcut to
just the model internally.

#### Example

```js
function reducer(state, action) {
  switch(action.type) {
    case 'LOAD_START':
      return loop(
        { ...state, isLoading: true },
        Cmd.promise(apiFetch, resolveActionCreator, rejectActionCreator, action.payload.id)
      );
    case 'LOAD_COMPLETE':
      return {
        ...state,
        isLoading: false,
        result: action.payload,
      };
    default:
      return state;
  }
}

// This guarantees that the return value of the reducer will be a loop result,
// regardless of if it was set as such in the reducer implementation. This makes
// it much easier to manually compose reducers without cluttering reducer
// implementations with `loop(state, Cmd.none())`.
export default compose(reducer, liftState);
```


## `getModel(loop): any`

* `loop: any` &ndash; any object.
* returns the model component of the array if the input is a `[any, Cmd]`
  pair, otherwise returns the input object.

#### Notes

`getModel` lets you extract just the model component of an array returned by
`loop`. It's useful in testing if you need to extract out the model component
to do custom comparisons like `Immutable.is()`.


## `getCmd(loop): Cmd | null`

* `loop: any` &ndash; any object.
* returns the cmd component of the array if the input is a `[any, cCmd]`
  pair, otherwise returns `null`.

#### Notes

`getCmd` lets you extract just the cmd component of an array returned by
`loop`. It's useful in testing if you need to separate the model and cmd and
test them separately.


## `isLoop(object): boolean`
 
 * `object: any` &ndash; any object.
 * returns whether the given object was created with the `loop` function.
 
 #### Notes
 
 `isLoop` lets you determine whether an object returned by a reducer includes an
 cmd. This function is useful for writing custom higher-order functionality on
 top of redux-loop's API, or for just writing your own combineReducers.



## `Cmds`

#### Notes

The `Cmd` object provides access to all of the functions you'll need to
represent different kinds of cmds to redux-loop's cmd processor. Every
cmd is a plain JavaScript object that simply describes to the store how to
process it. Cmd are never executed in the reducer, leaving your reducer pure
and testable.

### `Cmd.none()`

#### Notes

`none` is a no-op effect that you can use for convenience when building custom
effect creators from the ones provided. Since it does not resolve to an action
it doesn't cause any side effects to actually occur.

#### Examples

```js
// The following two expressions are equivalent when processed by the store.

return loop(
  { state, someProp: action.payload },
  Cmd.none()
);

// ...

return { state, someProp: action.payload }
```

### `Cmd.constant(action)`

* `action: Action` &ndash; a plain object with a `type` property that the store
  can dispatch.

#### Notes

`constant` allows you to schedule a plain action object for dispatch after the
current dispatch is complete. It can be useful for initiating multiple sequences
that run in parallel but don't need to communicate or complete at the same time.

#### Examples

```js
// Once the store has finished updating this part of the state with the new
// result where `someProp` is set to `action.payload` it will schedule another
// dispatch for the action SOME_ACTION.
return loop(
  { state, someProp: action.payload },
  Cmd.constant({ type: 'SOME_ACTION' })
);
```

### `Cmd.call(functionToRun, actionCreator, ...args)`

* `functionToRun: (...Array<any>) => any` &ndash; a function that will run
  some synchronous side effects and then return a value.
* `actionCreator: (any) => Action` &ndash; a function that that takes the value
 returned from functionToRun and returns an action which will be dispatched
* `args: Array<any>` &ndash; any arguments to call `functionToRun` with.


#### Notes

`call` allows you to declaratively schedule a function with some arguments that
can cause synchronous effects like manipulating `localStorage` or interacting
with `window` and then dispatch an action to represent the outcome. The return
value of `call` can be anything you want. The action creator just needs to be able to 
turn that value into an action. 

#### Examples

```js
const readKeyFromLocalStorage = (key) => {
  return localStorage[key];
}

// ...

return loop(
  state,
  Cmd.call(readKeyFromLocalStorage, updateFromLocalStorageAction, action.payload)
);
```

### `Cmd.promise(functionToRun, resolveActionCreator, rejectActionCreator, ...args)`

* `functionToRun: (...Array<any>) => Promise<any>` &ndash; a function which,
  when called with the values in `args`, will return a promise.
* `resolveActionCreator: (any) => Action` &ndash; a function that that takes the
promise resolution value of the promise returned by functionToRun and returns an
action which will be dispatched.
* `rejectActionCreator: (any) => Action` &ndash; a function that that takes the
promise rejection value of the promise returned by functionToRun and returns an
action which will be dispatched.
* `args: Array<any>` &ndash; any arguments to call `functionToRun` with.

#### Notes

`promise` allows you to declaratively schedule a function to be called with some
arguments that returns a Promise, which will then be awaited and the resulting 
value turned into a success or failure action and then dispatched. This function
allows you to represent almost any kind of async process to the store without
sacrificing functional purity or having to encapsulate implicit state outside
of your reducer. Keep in mind, functions that are handed off to the store with `promise`
are never invoked in the reducer, only by the store during your application's
runtime. You can invoke a reducer that returns a `promise` effect as many times
as you want and always get the same result by deep-equality without triggering
any async function calls in the process.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

function fetchUser(userId){
    return fetch(`/api/users/${userId}`);
}

function userFetchSuccessfulAction(user){
   return {
      type: 'USER_FETCH_SUCCESSFUL',
      user
   };
}

function userFetchFailedAction(err){
   return {
      type: 'USER_FETCH_ERROR',
      err
   };
}

function reducer(state , action) {
  switch(action.type) {
  case 'INIT':
    return loop(
      {...state, initStarted: true},
      Cmd.promise(fetchUser, userFetchSuccessfulAction, userFetchFailedAction, '123')
    );

  case 'USER_FETCH_SUCCESSFUL':
    return {...state, user: action.user};
    
  case 'USER_FETCH_FAILED':
    return {...state, error: action.error};
    
  default:
    return state;
  }
}
```

### `Cmd.batch(cmds)`

* `cmds: Array<Cmd>` &ndash; an array of cmds returned by any of the
  other cmd functions, or even nested calls to `Cmd.batch` or `Cmd.sequence`.

#### Notes

`batch` allows you to group cmds as a single cmd to be awaited and
dispatched. All cmds run in a batch will be executed in parallel, but they
will not proceed in parallel. For example, if a long-running request is batched
with an action scheduled with `Cmd.constant`, no dispatching of either
cnd will occur until the long-running request completes.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

function reducer(state , action) {
  switch(action.type) {
  case 'INIT':
    return loop(
      {...state, initStarted: true},
      Cmd.batch([
        Cmd.promise(fetchUser, userFetchSuccessfulAction, userFetchFailedAction, '123'),
        Cmd.promise(fetchItem, itemFetchSuccessfulAction, itemFetchFailedAction, '456')
      ])
    );

  case 'USER_FETCH_SUCCESSFUL':
    return {...state, user: action.user};
    
  case 'USER_FETCH_FAILED':
    return {...state, userError: action.error};
    
  case 'ITEM_FETCH_SUCCESSFUL':
    return {...state, item: action.item};
    
  case 'ITEM_FETCH_FAILED':
    return {...state, itemError: action.error};
    
  default:
    return state;
  }
}
```

### `Cmd.sequence(cmds)`

* `cmds: Array<Cmd>` &ndash; an array of cmds returned by any of the
  other cmd functions, or even nested calls to `Cmd.sequence` or `Cmd.batch`

#### Notes

`sequence` is similar to batch, but the cmds run one after the other. The resulting actions are still dispatched all at once after all cmds are done.

### `Cmd.map(cmd, higherOrderActionCreator, [...additionalArgs])`

* `cnd: Cmd` &ndash; a cmd, the resulting action of which will be
  passed to `higherOrderActionCreator` to be nested into a higher-order action.
* `higherOrderActionCreator` &ndash; an action creator function which will
  accept an action, or optional some other arguments followed by an action, and
  return a new action in which the previous action was nested.
* `additionalArgs` &ndash; a list of additional arguments to pass to
  `higherOrderActionCreator` before passing in the action from the cmd.


#### Notes

`map` allows you to take an existing cmd from a nested reducer in your
state and lift it to a more general action in which the resulting action is
nested. This enables you to build your reducer in a fractal-like fashion, in
which all of the logic for a particular slice of your state is totally
encapsulated and actions can be simply directed to the reducer for that slice.

#### Examples

**nestedState.js**
```js
function incrementAsync(amount) {
  return new Promise((resolve) => {
    setTimeout(() => (
      resolve(amount)
    ), 100);
  });
}

function incrementStart(amount) {
  return { type: 'INCREMENT_START', payload: amount };
}

function nestedReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT_START':
      return loop(
        state,
        Cmd.promise(incrementAsync, incrementSuccessAction, incremenetFailedAction, action.payload)
      );
    case 'INCREMENT':
      return loop(
        state + action.payload,
        Cmd.none()
      );
    default:
      return loop(
        state,
        Cmd.none()
      );
  }
}
```

**topState.js**
```js
import nestedReducer from './nestedState';

function nestedAction(action) {
  return { type: 'NESTED_ACTION', payload: action };
}

function reducer(state = { /* ... */ }, action) {
  switch(action.type) {
    // ... other top-level things

    case 'NESTED_ACTION':
      const [model, cmd] = nestedReducer(state.nestedCount, action.payload);
      return loop(
        { ...state, nestedCount: model },
        Cmd.map(cmd, nestedAction)
      );

    default:
      return state;
  }
}
```

## `combineReducers(reducersMap, [initialState, accessor, modifier])`

* `reducersMap: Object<string, ReducerFunction>` &ndash; a map of keys to nested
  reducers, just like the `combineReducers` you would find in Redux itself.
* `initialState: any` &ndash; an optional initial value to map over when
  combining reducer results. Defaults to a plain object `{}`, but could be, for
  example, an `Immutable.Map`.
* `accessor: (state: any, key: any) => any` &ndash; a function to use when
  looking up the existing state for a reducer key on the state atom. Defaults to
  plain object property access, but can be passed a function to look up a key on
  an `Immutable.Map`, for example.
* `modifier: (state: any, key: any, value: any) => any` &ndash; a function to
  use when updating the existing state atom with the result of a reducer for a
  given key. Defaults to plain object property setting but can be implemented as
  a call to `set()` on an `Immutable.Map`, for example.

#### Notes

Reducer composition is key to a clean Redux application. The built-in Redux
`combineReducers` won't work for nested reducers that use `loop`, so we included
one that is aware that some reducers might have side effects. The `combineReducers`
in redux-loop knows how to compose cmds as well as state from nested reducers
so that your effects tree is always separate from your state tree. It's also
completely compatible with the one in Redux, so there should be no issues
switching to this implementation.

#### Examples
```js
import { combineReducers } from 'redux-loop';
import reducerWithSideEffects from './reducer-with-side-effects';
import plainReducer from './plain-reducer';

export default combineReducers({
  withEffects: reducerWithSideEffects,
  plain: plainReducer
});
```
