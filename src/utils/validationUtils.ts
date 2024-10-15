import { ethers } from 'ethers';
import { InvalidParamError, InvalidSignatureError } from './errors';
import canonicalize from 'canonicalize';
import type { Context, RequestedProof } from './interfaces';
import loggerModule from './logger';
import type { ProofRequestOptions } from './types';
const logger = loggerModule.logger;

/**
 * Validates function parameters based on specified criteria
 * @param params - An array of objects containing input, paramName, and optional isString flag
 * @param functionName - The name of the function being validated
 * @throws InvalidParamError if any parameter fails validation
 */
export function validateFunctionParams(
  params: { input: any; paramName: string; isString?: boolean }[],
  functionName: string
): void {
  params.forEach(({ input, paramName, isString }) => {
    if (input == null) {
      logger.info(
        `Validation failed: ${paramName} in ${functionName} is null or undefined`
      );
      throw new InvalidParamError(
        `${paramName} passed to ${functionName} must not be null or undefined.`
      );
    }
    if (isString && typeof input !== 'string') {
      logger.info(
        `Validation failed: ${paramName} in ${functionName} is not a string`
      );
      throw new InvalidParamError(
        `${paramName} passed to ${functionName} must be a string.`
      );
    }
    if (isString && input.trim() === '') {
      logger.info(
        `Validation failed: ${paramName} in ${functionName} is an empty string`
      );
      throw new InvalidParamError(
        `${paramName} passed to ${functionName} must not be an empty string.`
      );
    }
  });
}

/**
 * Validates a URL string
 * @param url - The URL to validate
 * @param functionName - The name of the function calling this validation
 * @throws InvalidParamError if the URL is invalid or empty
 */
export function validateURL(url: string, functionName: string): void {
  try {
    new URL(url);
  } catch (e) {
    logger.info(
      `URL validation failed for ${url} in ${functionName}: ${
        (e as Error).message
      }`
    );
    throw new InvalidParamError(
      `Invalid URL format ${url} passed to ${functionName}.`,
      e as Error
    );
  }
}

/**
 * Validates a signature against the provided application ID
 * @param providerId - The ID of the provider
 * @param signature - The signature to validate
 * @param applicationId - The expected application ID
 * @param timestamp - The timestamp of the signature
 * @throws InvalidSignatureError if the signature is invalid or doesn't match the application ID
 */
export function validateSignature(
  providerId: string,
  signature: string,
  applicationId: string,
  timestamp: string
): void {
  try {
    logger.info(
      `Starting signature validation for providerId: ${providerId}, applicationId: ${applicationId}, timestamp: ${timestamp}`
    );

    const message = canonicalize({ providerId, timestamp });
    if (!message) {
      logger.info('Failed to canonicalize message for signature validation');
      throw new Error('Failed to canonicalize message');
    }
    const messageHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(message)
    );
    let appId = ethers.utils
      .verifyMessage(
        ethers.utils.arrayify(messageHash),
        ethers.utils.hexlify(signature)
      )
      .toLowerCase();

    if (
      ethers.utils.getAddress(appId) !== ethers.utils.getAddress(applicationId)
    ) {
      logger.info(
        `Signature validation failed: Mismatch between derived appId (${appId}) and provided applicationId (${applicationId})`
      );
      throw new InvalidSignatureError(
        `Signature does not match the application id: ${appId}`
      );
    }

    logger.info(
      `Signature validated successfully for applicationId: ${applicationId}`
    );
  } catch (err) {
    logger.info(`Signature validation failed: ${(err as Error).message}`);
    if (err instanceof InvalidSignatureError) {
      throw err;
    }
    throw new InvalidSignatureError(
      `Failed to validate signature: ${(err as Error).message}`
    );
  }
}

/**
 * Validates the requested proof object
 * @param requestedProof - The requested proof object to validate
 * @throws InvalidParamError if the requested proof object is not valid
 */
export function validateRequestedProof(requestedProof: RequestedProof): void {
  if (!requestedProof.url) {
    logger.info(
      `Requested proof validation failed: Provided url in requested proof is not valid`
    );
    throw new InvalidParamError(
      `The provided url in requested proof is not valid`
    );
  }

  if (
    requestedProof.parameters &&
    typeof requestedProof.parameters !== 'object'
  ) {
    logger.info(
      `Requested proof validation failed: Provided parameters in requested proof is not valid`
    );
    throw new InvalidParamError(
      `The provided parameters in requested proof is not valid`
    );
  }
}

/**
 * Validates the context object
 * @param context - The context object to validate
 * @throws InvalidParamError if the context object is not valid
 */
export function validateContext(context: Context): void {
  if (!context.contextAddress) {
    logger.info(
      `Context validation failed: Provided context address in context is not valid`
    );
    throw new InvalidParamError(
      `The provided context address in context is not valid`
    );
  }

  if (!context.contextMessage) {
    logger.info(
      `Context validation failed: Provided context message in context is not valid`
    );
    throw new InvalidParamError(
      `The provided context message in context is not valid`
    );
  }

  validateFunctionParams(
    [
      {
        input: context.contextAddress,
        paramName: 'contextAddress',
        isString: true,
      },
      {
        input: context.contextMessage,
        paramName: 'contextMessage',
        isString: true,
      },
    ],
    'validateContext'
  );
}

/**
 * Validates the options object
 * @param options - The options object to validate
 * @throws InvalidParamError if the options object is not valid
 */
export function validateOptions(options: ProofRequestOptions): void {
  if (
    options.acceptAiProviders &&
    typeof options.acceptAiProviders !== 'boolean'
  ) {
    logger.info(
      `Options validation failed: Provided acceptAiProviders in options is not valid`
    );
    throw new InvalidParamError(
      `The provided acceptAiProviders in options is not valid`
    );
  }

  if (options.log && typeof options.log !== 'boolean') {
    logger.info(
      `Options validation failed: Provided log in options is not valid`
    );
    throw new InvalidParamError(`The provided log in options is not valid`);
  }
}
