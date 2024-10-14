import URL from 'url-parse';
import type {
  ApplicationId,
  ParsedURL,
  SignedClaim,
  Signature,
  SessionStatus,
} from './types';
import type {
  Context,
  Proof,
  ProviderV2,
  RequestedClaim,
  RequestedProofs,
  WitnessData,
} from './interfaces';
import '@ethersproject/shims';
import { ethers } from 'ethers';
import { makeBeacon } from './smart-contract';
import { fetchWitnessListForClaim, createSignDataForClaim } from './witness';
import canonicalize from 'canonicalize';
import { BACKEND_BASE_URL, constants } from './constants';
import {
  CreateSessionError,
  InvalidSignatureError,
  ProofCallbackError,
  ProofNotVerifiedError,
  ProviderAPIError,
  UpdateSessionError,
  InvalidParamError,
} from './errors';

export function validateNotNullOrUndefined(
  input: any,
  paramName: string,
  functionName: string
) {
  if (input == null) {
    throw new InvalidParamError(
      `${paramName} passed to ${functionName} must not be null or undefined.`
    );
  }
}

export function validateNonEmptyString(
  input: string,
  paramName: string,
  functionName: string
) {
  if (typeof input !== 'string') {
    throw new InvalidParamError(
      `${paramName} passed to ${functionName} must be a string.`
    );
  }
  if (input.trim() === '') {
    throw new InvalidParamError(
      `${paramName} passed to ${functionName} must be a non-empty string.`
    );
  }
}
/*
    URL utils
*/
export function parse(url: string): ParsedURL {
  validateURL(url);

  const parsed = URL(url, /* parseQueryString */ true);

  for (const param in parsed.query) {
    parsed.query[param] = decodeURIComponent(parsed.query[param]!);
  }
  const queryParams = parsed.query;

  let path = parsed.pathname || null;
  let hostname = parsed.hostname || null;
  let scheme = parsed.protocol || null;

  if (scheme) {
    // Remove colon at end
    scheme = scheme.substring(0, scheme.length - 1);
  }

  return {
    hostname,
    path,
    queryParams,
    scheme,
  };
}

export function validateURL(url: string): void {
  if (typeof url !== 'string') {
    throw new Error(`Invalid URL: ${url}. URL must be a string.`);
  }
  if (!url) {
    throw new Error(`Invalid URL: ${url}. URL cannot be empty`);
  }
}

/*
  Witness Utils
*/

export async function getWitnessesForClaim(
  epoch: number,
  identifier: string,
  timestampS: number
) {
  const beacon = makeBeacon();
  if (!beacon) throw new Error('No beacon');
  const state = await beacon.getState(epoch);
  const witnessList = fetchWitnessListForClaim(state, identifier, timestampS);
  return witnessList.map((w: WitnessData) => w.id.toLowerCase());
}

/*
   Proof Utils
*/

/** recovers the addresses of those that signed the claim */
export function recoverSignersOfSignedClaim({
  claim,
  signatures,
}: SignedClaim) {
  const dataStr = createSignDataForClaim({ ...claim });
  return signatures.map((signature) =>
    ethers.utils
      .verifyMessage(dataStr, ethers.utils.hexlify(signature))
      .toLowerCase()
  );
}

/**
 * Asserts that the claim is signed by the expected witnesses
 * @param claim
 * @param expectedWitnessAddresses
 */
export function assertValidSignedClaim(
  claim: SignedClaim,
  expectedWitnessAddresses: string[]
) {
  const witnessAddresses = recoverSignersOfSignedClaim(claim);
  // set of witnesses whose signatures we've not seen
  const witnessesNotSeen = new Set(expectedWitnessAddresses);
  for (const witness of witnessAddresses) {
    if (witnessesNotSeen.has(witness)) {
      witnessesNotSeen.delete(witness);
    }
  }

  // check if all witnesses have signed
  if (witnessesNotSeen.size > 0) {
    throw new ProofNotVerifiedError(
      `Missing signatures from ${expectedWitnessAddresses.join(', ')}`
    );
  }
}

export async function getShortenedUrl(url: string) {
  try {
    const response = await fetch(BACKEND_BASE_URL + '/api/sdk/shortener', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullUrl: url,
      }),
    });
    const res = await response.json();
    const shortenedVerificationUrl = res.result.shortUrl;
    return shortenedVerificationUrl;
  } catch (err) {
    return url;
  }
}

export async function callProofCallback(sessionId: string, proof: Proof) {
  try {
    const response = await fetch(
      `${constants.DEFAULT_RECLAIM_CALLBACK_URL}${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: encodeURIComponent(JSON.stringify(proof)),
      }
    );
    if (!response.ok) {
      throw new ProofCallbackError('Error with sessionId: ' + sessionId);
    }
    const res = await response.json();
    return res;
  } catch (err) {
    throw new CreateSessionError('Error with sessionId: ' + sessionId);
  }
}
export async function createSession(
  sessionId: string,
  appId: string,
  providerId: string
) {
  try {
    const response = await fetch(
      BACKEND_BASE_URL + '/api/sdk/create-session/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          appId,
          providerId,
        }),
      }
    );
    if (!response.ok) {
      throw new CreateSessionError(
        'Error creating session with sessionId: ' + sessionId
      );
    }
    const res = await response.json();
    return res;
  } catch (err) {
    throw new CreateSessionError(
      'Error creating session with sessionId: ' + sessionId
    );
  }
}

export async function getSession(sessionId: string) {
  try {
    const response = await fetch(
      `${constants.DEFAULT_RECLAIM_STATUS_URL}${sessionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new ProviderAPIError(
        'Error getting session with sessionId: ' + sessionId
      );
    }
    const res = await response.json();
    return res;
  } catch (err) {
    throw new ProviderAPIError(
      'Error getting session with sessionId: ' + sessionId
    );
  }
}

export async function updateSession(sessionId: string, status: SessionStatus) {
  try {
    const response = await fetch(
      BACKEND_BASE_URL + '/api/sdk/update/session/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          status,
        }),
      }
    );
    if (!response.ok) {
      throw new UpdateSessionError(
        'Error updating session with sessionId: ' + sessionId
      );
    }
    const res = await response.json();
    return res;
  } catch (err) {
    throw new UpdateSessionError(
      'Error updating session with sessionId: ' + sessionId
    );
  }
}

export async function fetchProvidersByAppId(appId: string, providerId: string) {
  try {
    const response = await fetch(
      `${constants.GET_PROVIDERS_BY_ID_API}/${appId}/provider/${providerId}`
    );
    const res = await response.json();
    return res.providers.httpProvider;
  } catch (err) {
    throw new ProviderAPIError('Error fetching provider with AppId: ' + appId);
  }
}

export function validateProviderIdsAndReturnProviders(
  providerId: string,
  providers: ProviderV2[]
): ProviderV2 {
  let providerExists = providers.some(
    (provider) => providerId == provider.httpProviderId
  );
  if (!providerExists) {
    throw new ProviderAPIError(
      `The following provider Id is not included in your application => ${providerId}`
    );
  }
  return providers.find(
    (provider) => providerId == provider.httpProviderId
  ) as ProviderV2;
}

export function generateRequestedProofs(
  provider: ProviderV2,
  context: Context,
  callbackUrl: string,
  sessionId: string,
  redirectUser: boolean
): RequestedProofs {
  const providerParams: { [key: string]: string | undefined } = {};
  //tslint:disable-next-line
  provider.responseSelections.forEach((rs) =>
    rs.responseMatch
      .split(/{{(.*?)}}/)
      .filter((_, i) => i % 2)
      .forEach((param) => (providerParams[param] = undefined))
  );
  const claims = [
    {
      provider: encodeURIComponent(provider.name),
      context: JSON.stringify(context),
      httpProviderId: provider.httpProviderId,
      payload: {
        metadata: {
          name: encodeURIComponent(provider.name),
          logoUrl: provider.logoUrl,
          proofCardText: provider.proofCardText,
          proofCardTitle: provider.proofCardTitle,
        },
        url: provider.url,
        urlType: provider.urlType as 'CONSTANT' | 'REGEX',
        method: provider.method as 'GET' | 'POST',
        login: {
          url: provider.loginUrl,
        },
        responseSelections: provider.responseSelections,
        customInjection: provider.customInjection,
        bodySniff: provider.bodySniff,
        userAgent: provider.userAgent,
        geoLocation: provider.geoLocation,
        matchType: provider.matchType,
        injectionType: provider.injectionType,
        disableRequestReplay: provider.disableRequestReplay,
        parameters: providerParams,
      },
    },
  ] as RequestedClaim[];

  return {
    id: sessionId,
    sessionId: sessionId,
    name: redirectUser ? 'web-r-SDK' : 'web-SDK',
    callbackUrl: callbackUrl,
    claims: claims,
  };
}

export function validateSignature(
  requestedProofs: RequestedProofs,
  signature: Signature,
  applicationId: ApplicationId,
  linkingVersion: string,
  timeStamp: string
) {
  try {
    let appId = '';
    if (
      requestedProofs.claims.length &&
      (linkingVersion === 'V2Linking' ||
        requestedProofs.claims[0]?.payload?.verificationType === 'MANUAL')
    ) {
      appId = ethers.utils
        .verifyMessage(
          ethers.utils.arrayify(
            ethers.utils.keccak256(
              new TextEncoder().encode(
                canonicalize({
                  providerId: requestedProofs.claims[0]?.httpProviderId,
                  timestamp: timeStamp,
                })!
              )
            )
          ),
          ethers.utils.hexlify(signature as unknown as string)
        )
        .toLowerCase();
    } else {
      appId = ethers.utils
        .verifyMessage(
          ethers.utils.arrayify(
            ethers.utils.keccak256(
              new TextEncoder().encode(canonicalize(requestedProofs)!)
            )
          ),
          ethers.utils.hexlify(signature as unknown as string)
        )
        .toLowerCase();
    }

    if (
      ethers.utils.getAddress(appId) !== ethers.utils.getAddress(applicationId)
    ) {
      throw new InvalidSignatureError(
        `Signature does not match the application id: ${appId}`
      );
    }
  } catch (err) {
    throw err;
  }
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export async function getBranchLink(template: string): Promise<string> {
  try {
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        template: template,
      }),
    };

    const response = await fetch(constants.RECLAIM_GET_BRANCH_URL, options);
    if (response.status !== 200) {
      throw new Error(
        'Error creating verification request - Branch Link not created'
      );
    }
    const data = await response.json();
    const link = data?.branchUrl;
    if (!link) {
      throw new Error(
        'Error creating verification request - Branch Link not created'
      );
    }
    return link;
  } catch (err) {
    throw err;
  }
}
