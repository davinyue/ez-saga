The dy-saga project is a project that imitates dva-js

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