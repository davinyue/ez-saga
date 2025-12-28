export const modelName = 'counter';

export interface CounterState {
  count: number;
  loading: boolean;
}

const counterModel = {
  name: modelName,
  state: {
    count: 0,
    loading: false,
  } as CounterState,
  reducers: {
    increment: (state: CounterState) => {
      return {
        ...state,
        count: state.count + 1,
      };
    },
    decrement: (state: CounterState) => {
      return {
        ...state,
        count: state.count - 1,
      };
    },
    reset: (state: CounterState) => {
      return {
        ...state,
        count: 0,
      };
    },
    setLoading: (state: CounterState, action: { payload: boolean }) => {
      return {
        ...state,
        loading: action.payload,
      };
    },
  },
  effects: {
    *asyncIncrement(_action: any, { put }: any) {
      // 设置 loading 状态
      yield put({
        type: `${modelName}/setLoading`,
        payload: true,
      });

      // 模拟异步操作
      yield new Promise((resolve) => setTimeout(resolve, 1000));

      // 增加计数
      yield put({
        type: `${modelName}/increment`,
      });

      // 取消 loading 状态
      yield put({
        type: `${modelName}/setLoading`,
        payload: false,
      });
    },
  },
};

export default counterModel;
