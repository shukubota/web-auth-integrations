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

  // microCMS
  MICROCMS_AUTHENTICATE: 'microcms:authenticate',
  MICROCMS_EXECUTE_COMMAND: 'microcms:execute-command',
  MICROCMS_GET_APIS: 'microcms:get-apis',
  MICROCMS_GET_CONTENT: 'microcms:get-content',
  MICROCMS_PARSE_INSTRUCTION: 'microcms:parse-instruction',
  MICROCMS_STATUS: 'microcms:status',
  MICROCMS_CLOSE_BROWSER: 'microcms:close-browser',

  // Database
  DB_SAVE: 'db:save',
  DB_LOAD: 'db:load',
  DB_QUERY: 'db:query',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
} as const;