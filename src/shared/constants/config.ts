export const APP_CONFIG = {
  name: 'Dual Service Integration Agent',
  version: '1.0.0',
  author: 'shukubota',
} as const;

export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
} as const;

export const DATABASE_CONFIG = {
  filename: 'app-data.db',
  migrations: {
    version: 1,
  },
} as const;

export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
} as const;

export const UI_CONFIG = {
  chat: {
    maxMessages: 1000,
    messageTimeout: 30000,
  },
  progress: {
    updateInterval: 500,
  },
} as const;