import type { Proof, ProviderClaimData } from './interfaces';
import type { ParsedQs } from 'qs';

export type ClaimID = ProviderClaimData['identifier'];

export type ClaimInfo = Pick<
  ProviderClaimData,
  'context' | 'provider' | 'parameters'
>;

export type AnyClaimInfo =
  | ClaimInfo
  | {
      identifier: ClaimID;
    };

export type CompleteClaimData = Pick<
  ProviderClaimData,
  'owner' | 'timestampS' | 'epoch'
> &
  AnyClaimInfo;

export type SignedClaim = {
  claim: CompleteClaimData;
  signatures: Uint8Array[];
};

export type QueryParams = ParsedQs;

// @needsAudit @docsMissing
export type ParsedURL = {
  scheme: string | null;
  hostname: string | null;
  /**
   * The path into the app specified by the URL.
   */
  path: string | null;
  /**
   * The set of query parameters specified by the query string of the url used to open the app.
   */
  queryParams: QueryParams | null;
};

export type CreateVerificationRequest = {
  providerIds: string[];
  applicationSecret?: string;
};

export type StartSessionParams = {
  onSuccessCallback: OnSuccessCallback;
  onFailureCallback: OnFailureCallback;
};

export type OnSuccessCallback = (proofs: Proof) => void;
export type OnFailureCallback = (error: Error) => void;

export type ProofRequestOptions = {
  log?: boolean;
  sessionId?: string;
};

export enum SessionStatus {
  SESSION_INIT = 'SESSION_INIT',
  SESSION_STARTED = 'SESSION_STARTED',
  USER_INIT_VERIFICATION = 'USER_INIT_VERIFICATION',
  USER_STARTED_VERIFICATION = 'USER_STARTED_VERIFICATION',
  PROOF_GENERATION_STARTED = 'PROOF_GENERATION_STARTED',
  PROOF_GENERATION_SUCCESS = 'PROOF_GENERATION_SUCCESS',
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
  PROOF_SUBMITTED = 'PROOF_SUBMITTED',
  PROOF_MANUAL_VERIFICATION_SUBMITED = 'PROOF_MANUAL_VERIFICATION_SUBMITED',
}

export type ApplicationId = string;
export type Signature = string;
export type AppCallbackUrl = string;
export type SessionId = string;
export type NoReturn = undefined;
