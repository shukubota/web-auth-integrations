export interface AuthCredentials {
  service1: ServiceCredentials;
  service2: ServiceCredentials;
}

export interface ServiceCredentials {
  username: string;
  password: string;
  baseUrl: string;
}

export interface EncryptedCredential {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface StoredCredentials {
  service1: EncryptedCredential;
  service2: EncryptedCredential;
  lastUpdated: Date;
}

export interface AuthSession {
  serviceId: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface AuthStatus {
  service1: {
    connected: boolean;
    lastLogin?: Date;
    error?: string;
  };
  service2: {
    connected: boolean;
    lastLogin?: Date;
    error?: string;
  };
}