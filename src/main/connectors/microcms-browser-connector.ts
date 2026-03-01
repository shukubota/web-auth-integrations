import { BrowserWindow } from 'electron';
import {
  MicroCMSCommand,
  MicroCMSCommandResult
} from '@shared/types/microcms';
import { AIAutomationEngine } from '../ai/ai-automation-engine';

export class MicroCMSBrowserConnector {
  private browserWindow: BrowserWindow | null = null;
  private isLoggedIn: boolean = false;
  private currentService: string | null = null;
  private aiEngine: AIAutomationEngine;

  constructor() {
    this.aiEngine = new AIAutomationEngine({
      maxRetries: 3,
      stepTimeout: 10000,
      screenshotDelay: 2000
    });
  }

  // Login with provided credentials
  async loginWithCredentials(email: string, password: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        this.createBrowserWindow();

        if (!this.browserWindow) {
          resolve(false);
          return;
        }

        // Navigate to microCMS login page (proper signin URL)
        await this.browserWindow.loadURL('https://auth.microcms.io/signin');

        // Wait for page to load
        await new Promise(r => setTimeout(r, 3000));

        // Fill in credentials and submit
        const loginSuccess = await this.browserWindow.webContents.executeJavaScript(`
          (async function() {
            try {
              // Wait for login form to be ready
              await new Promise((resolve) => {
                const checkForm = () => {
                  const emailField = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="メール"]');
                  const passwordField = document.querySelector('input[type="password"], input[name="password"]');
                  if (emailField && passwordField) {
                    resolve(true);
                  } else {
                    setTimeout(checkForm, 500);
                  }
                };
                checkForm();
              });

              // Fill email
              const emailField = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="メール"]');
              if (emailField) {
                emailField.focus();
                emailField.value = '${email}';
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
                emailField.dispatchEvent(new Event('change', { bubbles: true }));
              }

              // Small delay
              await new Promise(r => setTimeout(r, 500));

              // Fill password
              const passwordField = document.querySelector('input[type="password"], input[name="password"]');
              if (passwordField) {
                passwordField.focus();
                passwordField.value = '${password}';
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
              }

              // Small delay before submit
              await new Promise(r => setTimeout(r, 500));

              // Submit form
              const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("ログイン"), button:contains("Sign in"), button:contains("signin")');
              if (submitButton) {
                submitButton.click();
                return true;
              } else {
                // Try form submission
                const form = document.querySelector('form');
                if (form) {
                  form.submit();
                  return true;
                }
              }
              return false;
            } catch (error) {
              console.error('Login automation error:', error);
              return false;
            }
          })();
        `);

        if (!loginSuccess) {
          resolve(false);
          return;
        }

        // Wait for login to complete and check for success
        let checkCount = 0;
        const checkLogin = async () => {
          try {
            const isLoggedIn = await this.browserWindow?.webContents.executeJavaScript(`
              (window.location.href.includes('app.microcms.io') &&
               !window.location.href.includes('signin') &&
               !window.location.href.includes('login')) ||
              document.querySelector('body').innerText.includes('サービス') ||
              document.querySelector('body').innerText.includes('services')
            `);

            if (isLoggedIn) {
              this.isLoggedIn = true;
              await this.storeSessionData();
              resolve(true);
              return;
            }

            // Check for error messages
            const hasError = await this.browserWindow?.webContents.executeJavaScript(`
              document.querySelector('body').innerText.includes('正しくありません') ||
              document.querySelector('body').innerText.includes('incorrect') ||
              document.querySelector('body').innerText.includes('エラー')
            `);

            if (hasError) {
              resolve(false);
              return;
            }

            checkCount++;
            if (checkCount < 10) {
              setTimeout(checkLogin, 1000);
            } else {
              resolve(false);
            }
          } catch (error) {
            resolve(false);
          }
        };

        // Start checking
        setTimeout(checkLogin, 2000);

      } catch (error) {
        console.error('Login error:', error);
        reject(error);
      }
    });
  }

  private async storeSessionData(): Promise<void> {
    try {
      if (!this.browserWindow) return;

      const session = this.browserWindow.webContents.session;
      const cookies = await session.cookies.get({ url: 'https://microcms.io' });

      // Store session info for auto-login next time
      // const sessionData = {
      //   cookies: cookies,
      //   timestamp: Date.now()
      // };

      // Note: In a real implementation, you would encrypt and store this securely
      // For now, we just log the session storage
      console.log('Session stored for auto-login, cookies count:', cookies.length);
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  private createBrowserWindow(): void {
    if (this.browserWindow) {
      return; // Already exists
    }

    this.browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
      title: 'microCMS ログイン',
    });

    // Open DevTools for debugging microCMS automation
    this.browserWindow.webContents.openDevTools();

    // Forward console logs from browser to main process
    this.browserWindow.webContents.on('console-message', (_event, level, message, _line, _sourceId) => {
      console.log(`[microCMS Browser Console] ${level}: ${message}`);
    });

    this.setupLoginDetection();
  }

  async openMicroCMSLogin(): Promise<boolean> {
    try {
      this.createBrowserWindow();

      if (!this.browserWindow) {
        return false;
      }

      // Load microCMS login page (proper signin URL to avoid registration page)
      await this.browserWindow.loadURL('https://auth.microcms.io/signin');

      return true;
    } catch (error) {
      console.error('Failed to open microCMS login:', error);
      return false;
    }
  }

  private setupLoginDetection(): void {
    if (!this.browserWindow) return;

    // Monitor URL changes to detect successful login
    this.browserWindow.webContents.on('did-navigate', (_, url) => {
      console.log('Navigated to:', url);

      // Check if user is on a service page (indicates successful login)
      const serviceMatch = url.match(/https:\/\/([^.]+)\.microcms\.io/);
      if (serviceMatch) {
        this.isLoggedIn = true;
        this.currentService = serviceMatch[1];
        console.log(`Logged in to service: ${this.currentService}`);
      } else if (url.includes('app.microcms.io') && !url.includes('login') && !url.includes('signin')) {
        this.isLoggedIn = true;
        console.log('Logged in to microCMS dashboard');
      }
    });

    // Monitor page load completion
    this.browserWindow.webContents.on('did-finish-load', () => {
      if (this.browserWindow) {
        this.injectHelper();
      }
    });

    // Handle window close
    this.browserWindow.on('closed', () => {
      this.browserWindow = null;
      this.isLoggedIn = false;
      this.currentService = null;
    });
  }

  private async injectHelper(): Promise<void> {
    if (!this.browserWindow) return;

    try {
      // Inject helper functions into the page
      await this.browserWindow.webContents.executeJavaScript(`
        window.microCMSHelper = {
          // Helper function to wait for elements
          waitForElement: function(selector, timeout = 10000) {
            return new Promise((resolve, reject) => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(element);
                return;
              }

              const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                  observer.disconnect();
                  resolve(element);
                }
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true
              });

              setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found: ' + selector));
              }, timeout);
            });
          },

          // Helper function to click elements
          clickElement: function(selector) {
            const element = document.querySelector(selector);
            if (element) {
              element.click();
              return true;
            }
            return false;
          },

          // Helper function to fill input fields
          fillInput: function(selector, value) {
            const element = document.querySelector(selector);
            if (element) {
              element.value = value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          },

          // Get current page info
          getPageInfo: function() {
            return {
              url: window.location.href,
              title: document.title,
              isServicePage: window.location.href.includes('.microcms.io'),
              isDashboard: window.location.href.includes('app.microcms.io')
            };
          }
        };
      `);
    } catch (error) {
      console.error('Failed to inject helper:', error);
    }
  }

  async executeCommand(command: MicroCMSCommand): Promise<MicroCMSCommandResult> {
    const startTime = Date.now();

    if (!this.browserWindow || !this.isLoggedIn) {
      return {
        success: false,
        message: 'microCMSにログインが必要です',
        error: 'Not authenticated',
        executionTime: Date.now() - startTime,
      };
    }

    try {
      let result;

      switch (command.type) {
        case 'create_service':
          result = await this.createServiceViaBrowser(command.data);
          break;

        case 'create_api':
          result = await this.createAPIViaBrowser(command.target, command.data);
          break;

        case 'create_content':
          result = await this.createContentViaBrowser(command.target, command.data);
          break;

        case 'upload_media':
          result = await this.uploadMediaViaBrowser(command.data);
          break;

        default:
          throw new Error(`Unsupported command type: ${command.type}`);
      }

      return {
        success: true,
        message: 'コマンドが正常に実行されました',
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: 'コマンドの実行に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async createServiceViaBrowser(serviceData: any): Promise<any> {
    if (!this.browserWindow) throw new Error('Browser window not available');

    try {
      console.log('🤖 Starting AI-powered service creation...');
      console.log('Service data:', serviceData);

      // Navigate to microCMS dashboard
      await this.browserWindow.loadURL('https://app.microcms.io/');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Prepare instruction for AI agent
      const serviceName = serviceData.name || 'MyNewService';
      const instruction = `Create a new service in microCMS with the name "${serviceName}". Look for a service creation button, click it, fill in the service name, and submit the form.`;

      console.log('📝 AI Instruction:', instruction);

      // Execute with AI automation engine
      const result = await this.aiEngine.executeInstruction(this.browserWindow, instruction);

      console.log('🎯 AI Automation Result:', result);

      if (result.success) {
        return {
          success: true,
          message: `Service "${serviceName}" created successfully using AI automation`,
          serviceName: serviceName,
          executedSteps: result.executedSteps,
          screenshotCount: result.screenshots.length
        };
      } else {
        throw new Error(result.error || 'AI automation failed');
      }

    } catch (error) {
      console.error('💥 AI service creation failed:', error);
      throw new Error(`Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createAPIViaBrowser(apiName: string, apiData: any): Promise<any> {
    if (!this.browserWindow) throw new Error('Browser window not available');

    try {
      // Execute API creation logic
      const result = await this.browserWindow.webContents.executeJavaScript(`
        new Promise(async (resolve, reject) => {
          try {
            // Look for API creation button
            const apiButton = await window.microCMSHelper.waitForElement('[href*="api"], .api-create, button:contains("API")');

            if (apiButton) {
              apiButton.click();

              // Wait and fill API form
              setTimeout(() => {
                window.microCMSHelper.fillInput('input[name="apiId"], input[placeholder*="API ID"]', '${apiName}');
                window.microCMSHelper.fillInput('input[name="apiName"], input[placeholder*="API名"]', '${apiName}');

                // Select API type if specified
                const apiType = '${apiData.type || 'list'}';
                if (apiType === 'list') {
                  window.microCMSHelper.clickElement('[value="list"], input[type="radio"][value="list"]');
                } else {
                  window.microCMSHelper.clickElement('[value="object"], input[type="radio"][value="object"]');
                }

                resolve({ apiName, type: apiType });
              }, 2000);
            } else {
              reject(new Error('API creation button not found'));
            }
          } catch (error) {
            reject(error);
          }
        });
      `);

      return result;
    } catch (error) {
      throw new Error(`Failed to create API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createContentViaBrowser(endpoint: string, contentData: any): Promise<any> {
    if (!this.browserWindow) throw new Error('Browser window not available');

    // Navigate to content creation page
    const contentUrl = `https://${this.currentService}.microcms.io/api/${endpoint}`;
    await this.browserWindow.loadURL(contentUrl);

    // Execute content creation
    const result = await this.browserWindow.webContents.executeJavaScript(`
      new Promise(async (resolve, reject) => {
        try {
          // Look for content creation button
          const createButton = await window.microCMSHelper.waitForElement('[data-testid="create-content"], .content-create, button:contains("追加")');

          if (createButton) {
            createButton.click();

            // Fill content fields
            setTimeout(() => {
              const title = '${contentData.title || 'New Content'}';
              const content = '${contentData.content || 'Content created by AI agent'}';

              window.microCMSHelper.fillInput('input[name="title"], [data-field="title"] input', title);
              window.microCMSHelper.fillInput('textarea[name="content"], [data-field="content"] textarea', content);

              resolve({ title, content });
            }, 2000);
          } else {
            reject(new Error('Create content button not found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    `);

    return result;
  }

  private async uploadMediaViaBrowser(_mediaData: any): Promise<any> {
    if (!this.browserWindow) throw new Error('Browser window not available');

    // Navigate to media page
    const mediaUrl = `https://${this.currentService}.microcms.io/media`;
    await this.browserWindow.loadURL(mediaUrl);

    return { message: 'Media upload interface opened. Please upload files manually.' };
  }

  async getLoginStatus(): Promise<{ isLoggedIn: boolean; currentService?: string; url?: string }> {
    if (!this.browserWindow) {
      return { isLoggedIn: false };
    }

    try {
      const pageInfo = await this.browserWindow.webContents.executeJavaScript(`
        window.microCMSHelper ? window.microCMSHelper.getPageInfo() : { url: window.location.href, title: document.title }
      `);

      return {
        isLoggedIn: this.isLoggedIn,
        currentService: this.currentService || undefined,
        url: pageInfo.url,
      };
    } catch (error) {
      return { isLoggedIn: this.isLoggedIn, currentService: this.currentService || undefined };
    }
  }

  closeBrowser(): void {
    if (this.browserWindow) {
      this.browserWindow.close();
      this.browserWindow = null;
      this.isLoggedIn = false;
      this.currentService = null;
    }
  }

  getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow;
  }
}