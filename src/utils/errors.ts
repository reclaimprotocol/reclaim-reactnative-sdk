function createErrorClass(name: string) {
  return class extends Error {
    constructor(message?: string, public innerError?: Error) {
      super(message);
      this.name = name;
      if (innerError) {
        this.stack += `\nCaused by: ${innerError.stack}`;
      }
    }
  };
}

export const TimeoutError = createErrorClass('TimeoutError');
export const ProofNotVerifiedError = createErrorClass('ProofNotVerifiedError');
export const SessionNotStartedError = createErrorClass(
  'SessionNotStartedError'
);
export const ProviderNotFoundError = createErrorClass('ProviderNotFoundError');

export const SignatureGeneratingError = createErrorClass(
  'SignatureGeneratingError'
);
export const SignatureNotFoundError = createErrorClass(
  'SignatureNotFoundError'
);
export const InvalidSignatureError = createErrorClass('InvalidSignatureError');
export const UpdateSessionError = createErrorClass('UpdateSessionError');
export const InitSessionError = createErrorClass('InitSessionError');
export const ProviderFailedError = createErrorClass('ProviderFailedError');
export const InvalidParamError = createErrorClass('InvalidParamError');
export const ApplicationError = createErrorClass('ApplicationError');
export const InitError = createErrorClass('InitError');
export const BackendServerError = createErrorClass('BackendServerError');
export const GetStatusUrlError = createErrorClass('GetStatusUrlError');
export const SetParamsError = createErrorClass('SetParamsError');
export const AddContextError = createErrorClass('AddContextError');
export const SetSignatureError = createErrorClass('SetSignatureError');
export const GetAppCallbackUrlError = createErrorClass(
  'GetAppCallbackUrlError'
);
export const GetRequestUrlError = createErrorClass('GetRequestUrlError');
export const StatusUrlError = createErrorClass('StatusUrlError');
export const ProofNotFoundError = createErrorClass('ProofNotFoundError');
export const ProofSubmissionFailedError = createErrorClass(
  'ProofSubmissionFailedError'
);
