import React from 'react';
import { connect } from 'react-redux';
import { modelName, CounterState } from './counterModel';

interface CounterProps {
  count: number;
  loading: boolean;
  dispatch: any;
}

class Counter extends React.Component<CounterProps> {
  handleIncrement = () => {
    this.props.dispatch({ type: `${modelName}/increment` });
  };

  handleDecrement = () => {
    this.props.dispatch({ type: `${modelName}/decrement` });
  };

  handleReset = () => {
    this.props.dispatch({ type: `${modelName}/reset` });
  };

  handleAsyncIncrement = () => {
    this.props.dispatch({ type: `${modelName}/asyncIncrement` });
  };

  render() {
    const { count, loading } = this.props;
    return (
      <div>
        <div className="counter-display">
          <div className="counter-value" data-testid="counter-value">
            当前计数: {count}
          </div>
          <div className="loading-status" data-testid="loading-status">
            {loading ? '加载中...' : '就绪'}
          </div>
        </div>

        <div className="button-group">
          <button className="btn-increment" onClick={this.handleIncrement} data-testid="increment-btn">
            增加 +
          </button>
          <button className="btn-decrement" onClick={this.handleDecrement} data-testid="decrement-btn">
            减少 -
          </button>
          <button className="btn-reset" onClick={this.handleReset} data-testid="reset-btn">
            重置 0
          </button>
          <button className="btn-async" onClick={this.handleAsyncIncrement} data-testid="async-increment-btn">
            异步增加 + (1s)
          </button>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: { [key: string]: CounterState }) {
  const model = state[modelName];
  if (!model) {
    console.error(`[Counter] Model '${modelName}' not found in state. Current State:`, state);
    return {
      count: 0,
      loading: false,
    };
  }
  return {
    count: model.count,
    loading: model.loading,
  };
}

export default connect(mapStateToProps)(Counter);
