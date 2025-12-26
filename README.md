The ez-saga project is a project that imitates dva-js

# Why ez-saga?

`ez-saga` is designed to simplify Redux + Saga development, offering a modern, developer-friendly experience similar to `dva` but with significant improvements:

| Feature | ez-saga | dva | Raw Redux-Saga |
| :--- | :--- | :--- | :--- |
| **Model Architecture** | Centralized (State + Reducers + Effects) | Centralized | Scattered (Actions, Switch, Watchers separated) |
| **TypeScript Support** | **First-class**, with automatic type inference helper | Poor / Manual | Good but verbose |
| **Hot Module Replacement** | **Zero-config** (Vite & Webpack 5), supports hot-swapping reducers & effects | Broken / Unmaintained | Manual / Complex setup |
| **API Simplicity** | **High** (`createApp`, `regist`) | High | Low (High boilerplate) |
| **Build Tooling** | **Vite & Webpack 5** Support | Webpack 3/4 (Roadhog/Umi dependency) | Agnostic |
| **Maintenance** | Active | Inactive / Legacy | Active |

**Key Advantages:**
- **Zero Boilerplate**: No more action types, switch statements, or `yield take` watchers. Just write functions.
- **Modern HMR**: Built-in plugins for Vite and Webpack to keep your state and logic hot-updatable without page reloads.
- **Decoupled**: Works with any React setup, not tied to a specific framework like Umi.



# how to use?
install
```
npm install ez-saga --save
```

This is the entry file of the project.
```js
import 'core-js';
import 'react';
import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import ezSaga from 'ez-saga';
import Views from './views';
let app = ezSaga.createApp();
window.app = app;
class RouterConfig extends React.Component {
  render() {
    return (
      <Provider store={app.store}>
        <BrowserRouter>
          <Views app={app} />
        </BrowserRouter >
      </Provider>
    );
  }
}
ReactDom.render(<RouterConfig />, document.getElementById('root'));
```

Now let's define a model 'userModel.js'

```js
export const modelName = 'user';

const model = {
  /** model name */
  name: modelName,
  /** default state*/
  state: {
    userDetial: null
  },
  reducers: {
    /** save user reducer */
    saveUser: (state, action) => {
      let newStat = {
        ...state
      };
      newStat.userDetial = action.payload.userDetial;
      return newStat;
    }
  },
  effects: {
    /** getUserDetial effect */
    * getUserDetial({ payload }, { call, put, select }) {
      //let user = payload;
      let user = {
        id: '1',
        name: 'tom'
      };
      //async method call
      //yield call('async', agr1, agr2, arg3, ....);

      //save user
      yield put({
        type: `${modelName}/saveUser`,
        payload: {
          user: user
        }
      });
    },
    /** deleteUserDetial effect */
    *deleteUserDetial({ payload }, { call, put, select }) {
      let id = payload;
      //The saveState effect is built-in by default.
      yield put({
        type: `${modelName}/saveState`,
        payload: {
          userDetial: null
        }
      });
    }
  }
};

export default model;
```

Now we can register this model.

```js
import userModel from './userModel';
window.app.regist(userModel);
```

Next, we define a page.
```js
import React from 'react';
import { modelName } from './userModel';
import { connect } from 'react-redux';

class View extends React.Component {

  constructor(props) {
    super(props);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    this.props.dispatch({
      type: `${modelName}/deleteUserDetial`, payload: {}
    });
  }

  componentDidMount() {
    this.props.dispatch({ type: `${modelName}/getUserDetial`, payload: { id: 1 } });
  }

  render() {
    return (
      <div>
        <div>userDetail:{JSON.stringify(this.props.userDetail)}</div>
        <button onClick={this.handleDelete}>
          delete
        </button>
      </div>
    );
  }
}

function stateMapProps(state, props) {
  let model = state[modelName];
  return {
    userDetail: model.userDetail
  };
}

export default connect(stateMapProps)(View);
```

We can invoke reducers and effects using dispatch, and we can obtain the results returned by effects.

# Vite Plugin for HMR

`ez-saga` provides a built-in Vite plugin to support Hot Module Replacement (HMR) for models. This allows you to modify effects and reducers during development without reloading the page.

## Usage

1. Import the plugin in your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import ezSagaHmr from 'ez-saga/vite';

export default defineConfig({
  plugins: [
    ezSagaHmr(), // Add ez-saga HMR plugin
    // other plugins...
  ]
});
```

2. That's it! 

The plugin automatically detects your model files and injects hot update logic. When you modify a model file, `ez-saga` will:
- Cancel old saga tasks.
- Re-register the model reducers (hot-swap logic).
- Restart the effects.

**Note**: This requires your model files to be exported using `export default` and contain a `name` property.

# Webpack Plugin for HMR

For Webpack 5 users, `ez-saga` also provides a compatible HMR plugin.

## Usage

1. Import the plugin in your `webpack.config.js`:

```javascript
const EzSagaWebpackPlugin = require('ez-saga/webpack').default; // Notice the .default for CJS

module.exports = {
  // ...
  plugins: [
    new EzSagaWebpackPlugin(),
    // other plugins...
  ]
};
```

This plugin automatically configures the HMR loader for your model files.
