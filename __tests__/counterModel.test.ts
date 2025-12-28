import { describe, it, expect, beforeEach } from 'vitest';
import ezSaga from '../src/index';
import counterModel, { modelName } from './counterModel';

describe('Counter Model - Reducers', () => {
    let app: any;

    beforeEach(() => {
        app = ezSaga.createApp();
        app.regist(counterModel);
    });

    it('应该正确初始化状态', () => {
        const state = app.store.getState();
        expect(state[modelName]).toEqual({
            count: 0,
            loading: false,
        });
    });

    it('increment reducer 应该增加计数', () => {
        app.store.dispatch({ type: `${modelName}/increment` });
        const state = app.store.getState();
        expect(state[modelName].count).toBe(1);
    });

    it('decrement reducer 应该减少计数', () => {
        // 先增加到 5
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });

        // 然后减少
        app.store.dispatch({ type: `${modelName}/decrement` });
        const state = app.store.getState();
        expect(state[modelName].count).toBe(4);
    });

    it('reset reducer 应该重置计数为 0', () => {
        // 先增加计数
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });
        app.store.dispatch({ type: `${modelName}/increment` });

        // 然后重置
        app.store.dispatch({ type: `${modelName}/reset` });
        const state = app.store.getState();
        expect(state[modelName].count).toBe(0);
    });

    it('setLoading reducer 应该设置 loading 状态', () => {
        app.store.dispatch({
            type: `${modelName}/setLoading`,
            payload: true
        });
        let state = app.store.getState();
        expect(state[modelName].loading).toBe(true);

        app.store.dispatch({
            type: `${modelName}/setLoading`,
            payload: false
        });
        state = app.store.getState();
        expect(state[modelName].loading).toBe(false);
    });

    it('内置的 saveState reducer 应该能够更新状态', () => {
        app.store.dispatch({
            type: `${modelName}/saveState`,
            payload: {
                count: 100,
                loading: true,
            },
        });
        const state = app.store.getState();
        expect(state[modelName].count).toBe(100);
        expect(state[modelName].loading).toBe(true);
    });
});

describe('Counter Model - Effects', () => {
    let app: any;

    beforeEach(() => {
        app = ezSaga.createApp();
        app.regist(counterModel);
    });

    it('asyncIncrement effect 应该在延迟后增加计数', async () => {
        // 初始状态
        let state = app.store.getState();
        expect(state[modelName].count).toBe(0);
        expect(state[modelName].loading).toBe(false);

        // 触发异步增加
        app.store.dispatch({ type: `${modelName}/asyncIncrement` });

        // 等待一小段时间，loading 应该为 true
        await new Promise((resolve) => setTimeout(resolve, 100));
        state = app.store.getState();
        expect(state[modelName].loading).toBe(true);

        // 等待异步操作完成
        await new Promise((resolve) => setTimeout(resolve, 1000));
        state = app.store.getState();
        expect(state[modelName].count).toBe(1);
        expect(state[modelName].loading).toBe(false);
    });

    it('多次调用 asyncIncrement 应该累积计数', async () => {
        // 触发两次异步增加
        app.store.dispatch({ type: `${modelName}/asyncIncrement` });
        app.store.dispatch({ type: `${modelName}/asyncIncrement` });

        // 等待两次异步操作完成
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const state = app.store.getState();
        expect(state[modelName].count).toBe(2);
    });
});
