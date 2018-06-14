import { TRANSACTION, ResetTransactionSuccessfulAction } from '../types';
import {
  TRANSACTION_SIGN,
  SignLocalTransactionSucceededAction,
  SignWeb3TransactionSucceededAction,
  SignAction
} from './types';

export interface SignState {
  indexingHash: string | null;
  pending: boolean;
  local: {
    signedTransaction: Buffer | null;
  };
  web3: {
    transaction: Buffer | null;
  };
}

export type StateSerializedTx =
  | SignState['local']['signedTransaction']
  | SignState['web3']['transaction'];

export const SIGN_INITIAL_STATE: SignState = {
  local: { signedTransaction: null },
  web3: { transaction: null },
  indexingHash: null,
  pending: false
};

const signTransactionRequested = (): SignState => ({
  ...SIGN_INITIAL_STATE,
  pending: true
});

const signLocalTransactionSucceeded = (
  _: SignState,
  { payload }: SignLocalTransactionSucceededAction
): SignState => ({
  indexingHash: payload.indexingHash,
  pending: false,

  local: { signedTransaction: payload.signedTransaction },
  web3: { transaction: null }
});

const signWeb3TranscationSucceeded = (
  _: SignState,
  { payload }: SignWeb3TransactionSucceededAction
): SignState => ({
  indexingHash: payload.indexingHash,
  pending: false,

  local: { signedTransaction: null },
  web3: { transaction: payload.transaction }
});

const signTransactionFailed = () => SIGN_INITIAL_STATE;

const resetSign = () => SIGN_INITIAL_STATE;

export function signReducer(
  state: SignState = SIGN_INITIAL_STATE,
  action: SignAction | ResetTransactionSuccessfulAction
) {
  switch (action.type) {
    case TRANSACTION_SIGN.SIGN_TRANSACTION_REQUESTED:
      return signTransactionRequested();
    case TRANSACTION_SIGN.SIGN_LOCAL_TRANSACTION_SUCCEEDED:
      return signLocalTransactionSucceeded(state, action);
    case TRANSACTION_SIGN.SIGN_WEB3_TRANSACTION_SUCCEEDED:
      return signWeb3TranscationSucceeded(state, action);
    case TRANSACTION_SIGN.SIGN_TRANSACTION_FAILED:
      return signTransactionFailed();
    case TRANSACTION.RESET_SUCCESSFUL:
      return resetSign();
    default:
      return state;
  }
}
