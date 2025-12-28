import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import ezSaga, { ReduxModel } from '../src/index';
import counterModel from '../__tests__/counterModel';
import Counter from '../__tests__/Counter';

// 创建 ez-saga app
const app = ezSaga.createApp();
// 注册 counter model
app.regist(counterModel as ReduxModel);
// 将 app 挂载到 window 上，方便调试
(window as any).app = app;
// 渲染应用
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!);
root.render(<Provider store={app.store}>
  <Counter />
</Provider>);
// 输出一些调试信息
console.log('Ez-Saga App 已启动');
console.log('当前状态:', app.store.getState());

// 监听状态变化
app.store.subscribe(() => {
  console.log('状态已更新:', app.store.getState());
});
