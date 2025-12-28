import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import ezSaga from '../src/index';
import counterModel, { modelName } from './counterModel';
import Counter from './Counter';

describe('Counter Component', () => {
    let app: any;

    beforeEach(() => {
        app = ezSaga.createApp();
        app.regist(counterModel);
    });

    it('应该正确渲染初始状态', () => {
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 0');
        expect(screen.getByTestId('loading-status')).toHaveTextContent('就绪');
    });

    it('点击增加按钮应该增加计数', async () => {
        const user = userEvent.setup();
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        const incrementBtn = screen.getByTestId('increment-btn');
        await user.click(incrementBtn);

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 1');
    });

    it('点击减少按钮应该减少计数', async () => {
        const user = userEvent.setup();
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        // 先增加到 3
        const incrementBtn = screen.getByTestId('increment-btn');
        await user.click(incrementBtn);
        await user.click(incrementBtn);
        await user.click(incrementBtn);

        // 然后减少
        const decrementBtn = screen.getByTestId('decrement-btn');
        await user.click(decrementBtn);

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 2');
    });

    it('点击重置按钮应该重置计数', async () => {
        const user = userEvent.setup();
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        // 先增加计数
        const incrementBtn = screen.getByTestId('increment-btn');
        await user.click(incrementBtn);
        await user.click(incrementBtn);

        // 然后重置
        const resetBtn = screen.getByTestId('reset-btn');
        await user.click(resetBtn);

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 0');
    });

    it('点击异步增加按钮应该显示 loading 状态并在延迟后增加计数', async () => {
        const user = userEvent.setup();
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        const asyncIncrementBtn = screen.getByTestId('async-increment-btn');
        await user.click(asyncIncrementBtn);

        // 应该立即显示 loading 状态
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(screen.getByTestId('loading-status')).toHaveTextContent('加载中...');

        // 等待异步操作完成
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 1');
        expect(screen.getByTestId('loading-status')).toHaveTextContent('就绪');
    });

    it('多次操作应该正确累积', async () => {
        const user = userEvent.setup();
        render(
            <Provider store={app.store}>
                <Counter />
            </Provider>
        );

        const incrementBtn = screen.getByTestId('increment-btn');
        const decrementBtn = screen.getByTestId('decrement-btn');

        // 增加 5 次
        await user.click(incrementBtn);
        await user.click(incrementBtn);
        await user.click(incrementBtn);
        await user.click(incrementBtn);
        await user.click(incrementBtn);

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 5');

        // 减少 2 次
        await user.click(decrementBtn);
        await user.click(decrementBtn);

        expect(screen.getByTestId('counter-value')).toHaveTextContent('当前计数: 3');
    });
});
