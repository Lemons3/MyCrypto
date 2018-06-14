import { IOwnedDomainRequest, IBaseDomainRequest } from 'libs/ens';
import { isCreationAddress } from 'libs/validators';
import { AppState } from 'features/reducers';
import { REQUEST_STATES } from './domainRequests/types';
import { getDomainRequests } from './domainRequests/selectors';
import { getCurrentDomainName } from './domainSelector/selectors';

const isOwned = (data: IBaseDomainRequest): data is IOwnedDomainRequest => {
  return !!(data as IOwnedDomainRequest).ownerAddress;
};

export const getEns = (state: AppState) => state.ens;

export const getCurrentDomainData = (state: AppState) => {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain] || domainRequests[currentDomain].error) {
    return null;
  }

  const domainData = domainRequests[currentDomain].data || null;

  return domainData;
};

export const getResolvedAddress = (state: AppState, noGenesisAddress: boolean = false) => {
  const data = getCurrentDomainData(state);
  if (!data) {
    return null;
  }

  if (isOwned(data)) {
    const { resolvedAddress } = data;
    if (noGenesisAddress) {
      return !isCreationAddress(resolvedAddress) ? resolvedAddress : null;
    }
    return data.resolvedAddress;
  }
  return null;
};

export const getResolvingDomain = (state: AppState) => {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain]) {
    return null;
  }

  return domainRequests[currentDomain].state === REQUEST_STATES.pending;
};
