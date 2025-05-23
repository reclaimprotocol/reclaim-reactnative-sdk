import { ethers } from 'ethers';
import type { WitnessData } from './interfaces';
import type { SignedClaim, TemplateData } from './types';
import { createSignDataForClaim, fetchWitnessListForClaim } from '../witness';
import { BACKEND_BASE_URL, constants } from './constants';
import { replaceAll } from './helper';
import { validateURL } from './validationUtils';
import { makeBeacon } from '../smart-contract';
import { ProofNotVerifiedError } from './errors';
import loggerModule from './logger';
const logger = loggerModule.logger;

/**
 * Retrieves a shortened URL for the given URL
 * @param url - The URL to be shortened
 * @returns A promise that resolves to the shortened URL, or the original URL if shortening fails
 */
export async function getShortenedUrl(url: string): Promise<string> {
  logger.info(`Attempting to shorten URL: ${url}`);
  try {
    validateURL(url, 'getShortenedUrl');
    const response = await fetch(`${BACKEND_BASE_URL}/api/sdk/shortener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullUrl: url }),
    });
    const res = await response.json();
    if (!response.ok) {
      logger.info(
        `Failed to shorten URL: ${url}, Response: ${JSON.stringify(res)}`
      );
      return url;
    }
    const shortenedVerificationUrl = res.result.shortUrl;
    return shortenedVerificationUrl;
  } catch (err) {
    logger.info(`Error shortening URL: ${url}, Error: ${err}`);
    return url;
  }
}

/**
 * Creates a link with embedded template data
 * @param templateData - The data to be embedded in the link
 * @returns A promise that resolves to the created link (shortened if possible)
 */
export async function createLinkWithTemplateData(
  templateData: TemplateData
): Promise<string> {
  let template = encodeURIComponent(JSON.stringify(templateData));
  template = replaceAll(template, '(', '%28');
  template = replaceAll(template, ')', '%29');

  const fullLink = `${constants.RECLAIM_SHARE_URL}${template}`;
  try {
    const shortenedLink = await getShortenedUrl(fullLink);
    return shortenedLink;
  } catch (err) {
    logger.info(
      `Error creating link for sessionId: ${templateData.sessionId}, Error: ${err}`
    );
    return fullLink;
  }
}

/**
 * Retrieves the list of witnesses for a given claim
 * @param epoch - The epoch number
 * @param identifier - The claim identifier
 * @param timestampS - The timestamp in seconds
 * @returns A promise that resolves to an array of witness addresses
 * @throws Error if no beacon is available
 */
export async function getWitnessesForClaim(
  epoch: number,
  identifier: string,
  timestampS: number
): Promise<string[]> {
  const beacon = makeBeacon();
  if (!beacon) {
    logger.info('No beacon available for getting witnesses');
    throw new Error('No beacon available');
  }
  const state = await beacon.getState(epoch);
  const witnessList = fetchWitnessListForClaim(state, identifier, timestampS);
  const witnesses = witnessList.map((w: WitnessData) => w.id.toLowerCase());
  return witnesses;
}

/**
 * Recovers the signers' addresses from a signed claim
 * @param claim - The signed claim object
 * @param signatures - The signatures associated with the claim
 * @returns An array of recovered signer addresses
 */
export function recoverSignersOfSignedClaim({
  claim,
  signatures,
}: SignedClaim): string[] {
  const dataStr = createSignDataForClaim({ ...claim });
  return signatures.map((signature) =>
    ethers.utils
      .verifyMessage(dataStr, ethers.utils.hexlify(signature))
      .toLowerCase()
  );
}

/**
 * Asserts that a signed claim is valid by checking if all expected witnesses have signed
 * @param claim - The signed claim to validate
 * @param expectedWitnessAddresses - An array of expected witness addresses
 * @throws ProofNotVerifiedError if any expected witness signature is missing
 */
export function assertValidSignedClaim(
  claim: SignedClaim,
  expectedWitnessAddresses: string[]
): void {
  const witnessAddresses = recoverSignersOfSignedClaim(claim);
  const witnessesNotSeen = new Set(expectedWitnessAddresses);
  for (const witness of witnessAddresses) {
    if (witnessesNotSeen.has(witness)) {
      witnessesNotSeen.delete(witness);
    }
  }

  if (witnessesNotSeen.size > 0) {
    const missingWitnesses = Array.from(witnessesNotSeen).join(', ');
    logger.info(
      `Claim validation failed. Missing signatures from: ${missingWitnesses}`
    );
    throw new ProofNotVerifiedError(
      `Missing signatures from ${missingWitnesses}`
    );
  }
}
