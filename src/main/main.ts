import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { IPC_EVENTS } from '@shared/constants/ipc';

class Application {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.setupApp();
    this.setupIPC();
  }

  private setupApp(): void {
    // App event listeners
    app.whenReady().then(() => {
      this.createMainWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/preload.js'),
      },
      titleBarStyle: 'default',
      title: 'Dual Service Integration Agent',
    });

    // Load the renderer
    const rendererPath = `file://${path.join(__dirname, '../renderer/index.html')}`;

    this.mainWindow.loadURL(rendererPath);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();

      if (this.isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // Basic IPC handlers - will be expanded in later phases
    ipcMain.handle(IPC_EVENTS.AUTH_STATUS, async () => {
      return {
        service1: { connected: false },
        service2: { connected: false },
      };
    });

    ipcMain.handle(IPC_EVENTS.CHAT_MESSAGE, async (_, message: string) => {
      return {
        id: Date.now().toString(),
        type: 'system',
        content: `Received: ${message}`,
        timestamp: new Date(),
      };
    });
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// Initialize application
const application = new Application();

// Export for testing
export default application;