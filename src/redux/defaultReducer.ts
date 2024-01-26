/** 默认reducer */
import { Reducer } from 'redux';
import { PayloadAction } from './typeDeclare';

const saveState: Reducer<any, PayloadAction> = (state: any, action: PayloadAction) => {
  if (!action.payload) {
    return state;
  }
  let newStat = {
    ...state,
    ...action.payload
  };
  return newStat;
};

export default saveState;
