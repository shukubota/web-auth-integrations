import { contextBridge, ipcRenderer } from 'electron';
import { IPC_EVENTS } from '@shared/constants/ipc';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication
  login: (credentials: any) => ipcRenderer.invoke(IPC_EVENTS.AUTH_LOGIN, credentials),
  logout: () => ipcRenderer.invoke(IPC_EVENTS.AUTH_LOGOUT),
  getAuthStatus: () => ipcRenderer.invoke(IPC_EVENTS.AUTH_STATUS),

  // Chat
  sendMessage: (message: string) => ipcRenderer.invoke(IPC_EVENTS.CHAT_MESSAGE, message),
  getChatHistory: () => ipcRenderer.invoke(IPC_EVENTS.CHAT_HISTORY),

  // microCMS
  microCMS: {
    openLogin: () => ipcRenderer.invoke(IPC_EVENTS.MICROCMS_AUTHENTICATE),
    getStatus: () => ipcRenderer.invoke(IPC_EVENTS.MICROCMS_STATUS),
    executeCommand: (command: any) => ipcRenderer.invoke(IPC_EVENTS.MICROCMS_EXECUTE_COMMAND, command),
    parseInstruction: (instruction: string) => ipcRenderer.invoke(IPC_EVENTS.MICROCMS_PARSE_INSTRUCTION, instruction),
    closeBrowser: () => ipcRenderer.invoke(IPC_EVENTS.MICROCMS_CLOSE_BROWSER),
  },

  // Task management
  planTask: (instruction: string) => ipcRenderer.invoke(IPC_EVENTS.TASK_PLAN, instruction),
  executeTask: (planId: string) => ipcRenderer.invoke(IPC_EVENTS.TASK_EXECUTE, planId),

  // Event listeners
  onTaskProgress: (callback: (data: any) => void) => {
    ipcRenderer.on(IPC_EVENTS.TASK_PROGRESS, (_, data) => callback(data));
  },
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      login: (credentials: any) => Promise<any>;
      logout: () => Promise<void>;
      getAuthStatus: () => Promise<any>;
      sendMessage: (message: string) => Promise<any>;
      getChatHistory: () => Promise<any>;
      microCMS: {
        openLogin: () => Promise<any>;
        getStatus: () => Promise<any>;
        executeCommand: (command: any) => Promise<any>;
        parseInstruction: (instruction: string) => Promise<any>;
        closeBrowser: () => Promise<any>;
      };
      planTask: (instruction: string) => Promise<any>;
      executeTask: (planId: string) => Promise<any>;
      onTaskProgress: (callback: (data: any) => void) => void;
    };
  }
}