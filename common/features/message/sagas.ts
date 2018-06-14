import { SagaIterator } from 'redux-saga';
import { put, take, all, apply, takeEvery, call, select } from 'redux-saga/effects';

import translate, { translateRaw } from 'translations';
import { verifySignedMessage } from 'libs/signing';
import { IFullWallet } from 'libs/wallet';
import { padLeftEven } from 'libs/values';
import Web3Node from 'libs/nodes/web3';
import { showNotification } from 'features/notifications/actions';
import { PARITY_SIGNER, FinalizeSignatureAction } from 'features/paritySigner/types';
import { requestMessageSignature } from 'features/paritySigner/actions';
import { IWalletType, getWalletType, getWalletInst } from 'features/wallet/selectors';
import { MESSAGE, SignLocalMessageSucceededAction, SignMessageRequestedAction } from './types';
import { signLocalMessageSucceeded, signMessageFailed } from './actions';
import { getNodeLib } from '../config';

export function* signingWrapper(
  handler: (wallet: IFullWallet, message: string) => SagaIterator,
  action: SignMessageRequestedAction
): SagaIterator {
  const payloadMessage = action.payload;
  const wallet = yield select(getWalletInst);

  try {
    yield call(handler, wallet, payloadMessage);
  } catch (err) {
    yield put(showNotification('danger', translate('SIGN_MSG_FAIL', { $err: err.message }), 5000));
    yield put(signMessageFailed());
  }
}

export function messageToData(messageToTransform: string): string {
  return (
    '0x' +
    Array.from(Buffer.from(messageToTransform, 'utf8'))
      .map(n => padLeftEven(n.toString(16)))
      .join('')
  );
}

function* signLocalMessage(wallet: IFullWallet, msg: string): SagaIterator {
  const address = yield apply(wallet, wallet.getAddressString);
  const nodeLib: Web3Node = yield select(getNodeLib);
  const sig: string = yield apply(wallet, wallet.signMessage, [msg, nodeLib]);

  yield put(
    signLocalMessageSucceeded({
      address,
      msg,
      sig,
      version: '2'
    })
  );
}

function* signParitySignerMessage(wallet: IFullWallet, msg: string): SagaIterator {
  const address = yield apply(wallet, wallet.getAddressString);
  const data = yield call(messageToData, msg);

  yield put(requestMessageSignature(address, data));

  const { payload: sig }: FinalizeSignatureAction = yield take(PARITY_SIGNER.FINALIZE_SIGNATURE);

  if (!sig) {
    throw new Error(translateRaw('ERROR_38'));
  }

  yield put(
    signLocalMessageSucceeded({
      address,
      msg,
      sig,
      version: '2'
    })
  );
}

function* handleMessageRequest(action: SignMessageRequestedAction): SagaIterator {
  const walletType: IWalletType = yield select(getWalletType);

  const signingHandler = walletType.isParitySignerWallet
    ? signParitySignerMessage
    : signLocalMessage;

  return yield call(signingWrapper, signingHandler, action);
}

function* verifySignature(action: SignLocalMessageSucceededAction): SagaIterator {
  const success = yield call(verifySignedMessage, action.payload);

  if (success) {
    yield put(
      showNotification(
        'success',
        translate('SIGN_MSG_SUCCESS', { $address: action.payload.address })
      )
    );
  } else {
    yield put(signMessageFailed());
    yield put(showNotification('danger', translate('ERROR_38')));
  }
}

export const signing = [
  takeEvery(MESSAGE.SIGN_REQUESTED, handleMessageRequest),
  takeEvery(MESSAGE.SIGN_LOCAL_SUCCEEDED, verifySignature)
];

export function* messageSaga(): SagaIterator {
  yield all([...signing]);
}
