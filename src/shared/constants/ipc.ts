export const IPC_EVENTS = {
  // Authentication
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_STATUS: 'auth:status',
  AUTH_STORE_CREDENTIALS: 'auth:store-credentials',

  // Services
  SERVICE_CONNECT: 'service:connect',
  SERVICE_DISCONNECT: 'service:disconnect',
  SERVICE_STATUS: 'service:status',

  // Tasks
  TASK_PLAN: 'task:plan',
  TASK_EXECUTE: 'task:execute',
  TASK_CANCEL: 'task:cancel',
  TASK_PROGRESS: 'task:progress',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',
  CHAT_CLEAR: 'chat:clear',

  // Database
  DB_SAVE: 'db:save',
  DB_LOAD: 'db:load',
  DB_QUERY: 'db:query',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
} as const;