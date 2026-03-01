import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { IPC_EVENTS } from '@shared/constants/ipc';
import { MicroCMSBrowserConnector } from './connectors/microcms-browser-connector';

class Application {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';
  private microCMSBrowserConnector: MicroCMSBrowserConnector;

  constructor() {
    this.microCMSBrowserConnector = new MicroCMSBrowserConnector();
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
    // Authentication
    ipcMain.handle(IPC_EVENTS.AUTH_STATUS, async () => {
      return {
        service1: { connected: false },
        service2: { connected: false },
      };
    });

    // Chat
    ipcMain.handle(IPC_EVENTS.CHAT_MESSAGE, async (_, message: string) => {
      return await this.processUserMessage(message);
    });

    // microCMS
    ipcMain.handle(IPC_EVENTS.MICROCMS_AUTHENTICATE, async (_, credentials) => {
      try {
        const { email, password } = credentials;
        const success = await this.microCMSBrowserConnector.loginWithCredentials(email, password);
        return {
          success,
          message: success ? 'microCMSへのログインが完了しました。' : 'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
        };
      } catch (error) {
        return {
          success: false,
          message: 'ログイン中にエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    ipcMain.handle(IPC_EVENTS.MICROCMS_STATUS, async () => {
      const loginStatus = await this.microCMSBrowserConnector.getLoginStatus();
      return {
        connected: loginStatus.isLoggedIn,
        serviceId: loginStatus.currentService,
        url: loginStatus.url,
        browserOpen: !!this.microCMSBrowserConnector.getBrowserWindow(),
      };
    });

    ipcMain.handle(IPC_EVENTS.MICROCMS_EXECUTE_COMMAND, async (_, command) => {
      try {
        return await this.microCMSBrowserConnector.executeCommand(command);
      } catch (error) {
        return {
          success: false,
          message: 'コマンド実行エラー',
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
        };
      }
    });

    ipcMain.handle(IPC_EVENTS.MICROCMS_PARSE_INSTRUCTION, async (_, instruction: string) => {
      return await this.parseUserInstruction(instruction);
    });

    ipcMain.handle(IPC_EVENTS.MICROCMS_CLOSE_BROWSER, async () => {
      try {
        this.microCMSBrowserConnector.closeBrowser();
        return { success: true, message: 'ブラウザを閉じました' };
      } catch (error) {
        return {
          success: false,
          message: 'ブラウザを閉じる際にエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  private async processUserMessage(message: string): Promise<any> {
    try {
      // Parse user instruction and convert to microCMS command
      const parsedCommand = await this.parseUserInstruction(message);

      if (parsedCommand) {
        // Execute the command
        const result = await this.microCMSBrowserConnector.executeCommand(parsedCommand);

        // Check if error is authentication-related
        if (!result.success && result.error?.includes('Not authenticated')) {
          return {
            id: Date.now().toString(),
            type: 'error',
            content: 'microCMSに接続するには認証が必要です。認証情報を入力してください。',
            timestamp: new Date(),
            requiresAuth: true,
            error: result.error,
          };
        }

        return {
          id: Date.now().toString(),
          type: result.success ? 'agent' : 'error',
          content: result.success ? result.message : `エラー: ${result.error}`,
          timestamp: new Date(),
          metadata: { command: parsedCommand, result },
        };
      } else {
        // Regular chat response
        return {
          id: Date.now().toString(),
          type: 'agent',
          content: this.generateChatResponse(message),
          timestamp: new Date(),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's an authentication error
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('認証')) {
        return {
          id: Date.now().toString(),
          type: 'error',
          content: 'microCMSに接続するには認証が必要です。認証情報を入力してください。',
          timestamp: new Date(),
          requiresAuth: true,
          error: errorMessage,
        };
      }

      return {
        id: Date.now().toString(),
        type: 'error',
        content: 'メッセージの処理中にエラーが発生しました。',
        timestamp: new Date(),
        error: errorMessage,
      };
    }
  }

  private async parseUserInstruction(instruction: string): Promise<any | null> {
    const lowerInstruction = instruction.toLowerCase();

    // サービス追加
    if (lowerInstruction.includes('サービス') && lowerInstruction.includes('追加')) {
      return {
        type: 'create_service',
        target: 'new-service',
        data: { name: 'New Service' }
      };
    }

    // API作成
    if (lowerInstruction.includes('api') && lowerInstruction.includes('作成')) {
      const apiName = this.extractApiName(instruction) || 'new-api';
      return {
        type: 'create_api',
        target: apiName,
        data: {
          type: 'list',
          fields: [
            { fieldId: 'title', displayName: 'タイトル', kind: 'text', required: true },
            { fieldId: 'content', displayName: '内容', kind: 'richEditor', required: false }
          ]
        }
      };
    }

    // コンテンツ作成
    if (lowerInstruction.includes('コンテンツ') && lowerInstruction.includes('作成')) {
      return {
        type: 'create_content',
        target: 'blog', // Default endpoint
        data: {
          title: 'New Content',
          content: 'Content created via AI agent'
        }
      };
    }

    // メディアアップロード
    if (lowerInstruction.includes('メディア') && lowerInstruction.includes('アップロード')) {
      return {
        type: 'upload_media',
        target: 'media',
        data: { /* file data would be provided */ }
      };
    }

    return null; // No command detected
  }

  private extractApiName(instruction: string): string | null {
    // Extract API name from instruction (simple pattern matching)
    const match = instruction.match(/([a-zA-Z0-9_-]+)?\s*api/i);
    return match ? match[1] || 'blog' : null;
  }

  private generateChatResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('こんにちは')) {
      return 'こんにちは！microCMSの操作をお手伝いします。何をしたいかを教えてください。';
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('ヘルプ')) {
      return `以下の操作をサポートしています：

🔧 **サービス管理**
• "サービスを追加して" - 新しいmicroCMSサービスを作成

📋 **API管理**
• "ブログAPIを作成して" - APIスキーマを作成
• "商品APIを作成して" - 商品用のAPIを作成

📝 **コンテンツ管理**
• "ブログコンテンツを作成して" - 新しい記事を作成
• "コンテンツを更新して" - 既存コンテンツを更新

📸 **メディア管理**
• "メディアをアップロードして" - 画像やファイルをアップロード

具体的な指示をお気軽にお話しください！`;
    }

    return `「${message}」について承りました。

microCMSの操作をお手伝いします。以下のような指示が可能です：

• サービスの追加・管理
• APIの作成・編集
• コンテンツの作成・更新
• メディアのアップロード

より具体的な操作をお聞かせください。`;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// Initialize application
const application = new Application();

// Export for testing
export default application;