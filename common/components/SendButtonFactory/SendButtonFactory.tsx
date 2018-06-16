import React, { Component } from 'react';
import { connect } from 'react-redux';
import EthTx from 'ethereumjs-tx';

import { AppState } from 'features/reducers';
import * as selectors from 'features/selectors';
import { walletSelectors } from 'features/wallet';
import {
  isNetworkRequestPending,
  isValidGasPrice,
  isValidGasLimit,
  getSignedTx,
  getWeb3Tx
} from 'features/transaction';
import { ConfirmationModal } from 'components/ConfirmationModal';
import { OnlineSend } from './OnlineSend';

export interface CallbackProps {
  disabled: boolean;
  signTx(): void;
  openModal(): void;
}

interface StateProps {
  walletType: walletSelectors.IWalletType;
  serializedTransaction: AppState['transaction']['sign']['local']['signedTransaction'];
  transaction: EthTx;
  isFullTransaction: boolean;
  networkRequestPending: boolean;
  validGasPrice: boolean;
  validGasLimit: boolean;
  signedTx: boolean;
}

interface OwnProps {
  onlyTransactionParameters?: boolean;
  signing?: boolean;
  Modal: typeof ConfirmationModal;
  withProps(props: CallbackProps): React.ReactElement<any> | null;
}

type Props = StateProps & OwnProps;

export class SendButtonFactoryClass extends Component<Props> {
  public render() {
    const {
      signing,
      signedTx,
      transaction,
      isFullTransaction,
      serializedTransaction,
      networkRequestPending,
      validGasPrice,
      validGasLimit
    } = this.props;

    // return signing ? true : signedTx ? true : false
    return (
      (signing || (!signing && signedTx)) && (
        <OnlineSend
          withOnClick={({ openModal, signer }) =>
            this.props.withProps({
              disabled: signing
                ? !isFullTransaction || networkRequestPending || !validGasPrice || !validGasLimit
                : !!(signing && !serializedTransaction),
              signTx: () => signer(transaction),
              openModal
            })
          }
          Modal={this.props.Modal}
        />
      )
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    walletType: walletSelectors.getWalletType(state),
    serializedTransaction: selectors.getSerializedTransaction(state),
    ...selectors.getTransaction(state),
    networkRequestPending: isNetworkRequestPending(state),
    validGasPrice: isValidGasPrice(state),
    validGasLimit: isValidGasLimit(state),
    signedTx: !!getSignedTx(state) || !!getWeb3Tx(state)
  };
};

export const SendButtonFactory = connect(mapStateToProps)(SendButtonFactoryClass);
