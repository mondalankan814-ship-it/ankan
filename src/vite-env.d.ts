/// <reference types="vite/client" />

// Web OTP API type declarations
interface OTPCredential extends Credential {
  code: string;
}

interface OTPCredentialRequestOptions extends CredentialRequestOptions {
  otp?: {
    transportMethods: ('sms' | 'internal')[];
  };
}

interface Window {
  OTPCredential?: new () => OTPCredential;
}

interface CredentialRequestOptions {
  otp?: {
    transportMethods: ('sms' | 'internal')[];
  };
}
