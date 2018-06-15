import BN from 'bn.js';

import { Wei, TokenValue } from 'libs/units';
import { AppState } from 'features/reducers';
import * as configSelectors from 'features/config/selectors';
import * as transactionSelectors from 'features/transaction/selectors';

export const getRates = (state: AppState) => state.rates;

const getUSDConversionRate = (state: AppState, unit: string) => {
  const { isTestnet } = configSelectors.getNetworkConfig(state);
  const { rates } = getRates(state);
  if (isTestnet) {
    return null;
  }

  const conversionRate = rates[unit];

  if (!conversionRate) {
    return null;
  }
  return conversionRate.USD;
};

export const getValueInUSD = (state: AppState, value: TokenValue | Wei) => {
  const unit = transactionSelectors.getUnit(state);
  const conversionRate = getUSDConversionRate(state, unit);
  if (!conversionRate) {
    return null;
  }
  const sendValueUSD = value.muln(conversionRate);
  return sendValueUSD;
};
export const getTransactionFeeInUSD = (state: AppState, fee: Wei) => {
  const { unit } = configSelectors.getNetworkConfig(state);
  const conversionRate = getUSDConversionRate(state, unit);

  if (!conversionRate) {
    return null;
  }

  const feeValueUSD = fee.muln(conversionRate);
  return feeValueUSD;
};

export interface AllUSDValues {
  valueUSD: BN | null;
  feeUSD: BN | null;
  totalUSD: BN | null;
}

export const getAllUSDValuesFromSerializedTx = (state: AppState): AllUSDValues => {
  const fields = transactionSelectors.getParamsFromSerializedTx(state);
  if (!fields) {
    return {
      feeUSD: null,
      valueUSD: null,
      totalUSD: null
    };
  }
  const { currentValue, fee } = fields;
  const valueUSD = getValueInUSD(state, currentValue);
  const feeUSD = getTransactionFeeInUSD(state, fee);
  return {
    feeUSD,
    valueUSD,
    totalUSD: feeUSD && valueUSD ? valueUSD.add(feeUSD) : null
  };
};
