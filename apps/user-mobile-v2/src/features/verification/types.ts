export type LocalVerificationResult = {
  claimId: string;
  itemId: string;
  claimReadBack: boolean;
  failedNetworkKeptClaim: boolean;
  failedNetworkResult: {
    accepted: number;
    failed: number;
    pushed: number;
    rejected: number;
  };
  pendingBefore: number;
  pendingAfterCreate: number;
};
