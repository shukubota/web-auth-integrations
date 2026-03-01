import { BrowserWindow } from 'electron';
import { ClaudeAIClient, OperationStep } from './claude-client';

export interface AutomationConfig {
  maxRetries: number;
  stepTimeout: number;
  screenshotDelay: number;
  apiKey?: string;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  executedSteps: OperationStep[];
  screenshots: Buffer[];
  error?: string;
}

export class AIAutomationEngine {
  private claudeClient: ClaudeAIClient;
  private config: AutomationConfig;

  constructor(config: Partial<AutomationConfig> = {}) {
    this.config = {
      maxRetries: 3,
      stepTimeout: 10000,
      screenshotDelay: 1000,
      ...config
    };

    try {
      this.claudeClient = new ClaudeAIClient();
    } catch (error) {
      console.warn('⚠️ AI automation disabled:', error instanceof Error ? error.message : 'Unknown error');
      this.claudeClient = null as any;
    }
  }

  async executeInstruction(
    browserWindow: BrowserWindow,
    instruction: string
  ): Promise<AutomationResult> {
    const executedSteps: OperationStep[] = [];
    const screenshots: Buffer[] = [];
    let retryCount = 0;

    try {
      if (!this.claudeClient) {
        throw new Error('Claude AI client not available. Please set ANTHROPIC_API_KEY environment variable.');
      }

      console.log('🤖 AI Automation: Starting instruction execution:', instruction);

      while (retryCount < this.config.maxRetries) {
        try {
          // Step 1: Take screenshot and get page context
          const screenshot = await this.takeScreenshot(browserWindow);
          screenshots.push(screenshot);

          const pageContext = await this.getPageContext(browserWindow);
          console.log('📱 Page context:', pageContext);

          // Step 2: Ask Claude to analyze and plan
          console.log('🧠 Asking Claude to analyze screen and create plan...');
          const analysis = await this.claudeClient.analyzeScreenAndPlan(
            screenshot,
            instruction,
            pageContext
          );

          console.log('📋 Claude\'s plan:', analysis);

          if (!analysis.success) {
            throw new Error(`Claude analysis failed: ${analysis.message}`);
          }

          // Step 3: Execute the plan step by step
          for (const step of analysis.steps) {
            console.log(`🎬 Executing step: ${step.description}`);

            try {
              await this.executeStep(browserWindow, step);
              executedSteps.push(step);

              // Wait after each step
              await new Promise(resolve => setTimeout(resolve, this.config.screenshotDelay));

            } catch (stepError) {
              console.error('❌ Step execution failed:', stepError);
              throw stepError;
            }
          }

          // Step 4: Verify the result
          const finalScreenshot = await this.takeScreenshot(browserWindow);
          screenshots.push(finalScreenshot);

          const verification = await this.claudeClient.verifyResult(
            finalScreenshot,
            instruction,
            executedSteps
          );

          console.log('✅ Verification result:', verification);

          if (verification.success) {
            return {
              success: true,
              message: analysis.message,
              executedSteps,
              screenshots
            };
          } else {
            // If verification failed but we have next steps, try those
            if (verification.nextSteps && verification.nextSteps.length > 0) {
              console.log('🔄 Executing additional steps from verification...');
              for (const step of verification.nextSteps) {
                await this.executeStep(browserWindow, step);
                executedSteps.push(step);
              }

              // Re-verify
              const reVerification = await this.claudeClient.verifyResult(
                await this.takeScreenshot(browserWindow),
                instruction,
                executedSteps
              );

              if (reVerification.success) {
                return {
                  success: true,
                  message: reVerification.message,
                  executedSteps,
                  screenshots
                };
              }
            }

            throw new Error(`Verification failed: ${verification.message}`);
          }

        } catch (attemptError) {
          retryCount++;
          console.error(`❌ Attempt ${retryCount} failed:`, attemptError);

          if (retryCount >= this.config.maxRetries) {
            throw attemptError;
          }

          // Ask Claude to adapt to the error
          console.log('🔧 Asking Claude to adapt to error...');
          const currentScreenshot = await this.takeScreenshot(browserWindow);
          const adaptation = await this.claudeClient.adaptToError(
            currentScreenshot,
            attemptError instanceof Error ? attemptError.message : 'Unknown error',
            instruction,
            executedSteps
          );

          if (adaptation.success) {
            console.log('🔄 Retrying with adapted plan...');
            continue;
          } else {
            throw new Error(`Adaptation failed: ${adaptation.message}`);
          }
        }
      }

      throw new Error('Max retries exceeded');

    } catch (error) {
      console.error('💥 AI Automation failed:', error);
      return {
        success: false,
        message: 'AI automation failed',
        executedSteps,
        screenshots,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async takeScreenshot(browserWindow: BrowserWindow): Promise<Buffer> {
    try {
      const image = await browserWindow.webContents.capturePage();
      return image.toPNG();
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw new Error('Failed to capture screenshot');
    }
  }

  private async getPageContext(browserWindow: BrowserWindow): Promise<any> {
    try {
      return await browserWindow.webContents.executeJavaScript(`
        ({
          url: window.location.href,
          title: document.title,
          pageType: (() => {
            const url = window.location.href;
            if (url.includes('app.microcms.io')) {
              if (url.includes('/apis')) return 'api_management';
              if (url.includes('/media')) return 'media_management';
              if (url.includes('/content')) return 'content_management';
              return 'dashboard';
            }
            if (url.includes('auth.microcms.io')) return 'authentication';
            return 'unknown';
          })(),
          bodyText: document.body ? document.body.innerText.substring(0, 500) : '',
          formCount: document.querySelectorAll('form').length,
          buttonCount: document.querySelectorAll('button').length,
          inputCount: document.querySelectorAll('input').length
        })
      `);
    } catch (error) {
      console.error('Get page context failed:', error);
      return { url: 'unknown', title: 'unknown', pageType: 'unknown' };
    }
  }

  private async executeStep(browserWindow: BrowserWindow, step: OperationStep): Promise<void> {
    switch (step.type) {
      case 'click':
        await this.executeClick(browserWindow, step);
        break;
      case 'input':
        await this.executeInput(browserWindow, step);
        break;
      case 'wait':
        await this.executeWait(step);
        break;
      case 'navigate':
        await this.executeNavigate(browserWindow, step);
        break;
      case 'verify':
        await this.executeVerify(browserWindow, step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeClick(browserWindow: BrowserWindow, step: OperationStep): Promise<void> {
    try {
      if (step.selector) {
        // Click by CSS selector
        await browserWindow.webContents.executeJavaScript(`
          (function() {
            const element = document.querySelector('${step.selector}');
            if (!element) {
              throw new Error('Element not found: ${step.selector}');
            }
            element.scrollIntoView();
            element.click();
            return true;
          })()
        `);
      } else if (step.coordinates) {
        // Click by coordinates
        await browserWindow.webContents.executeJavaScript(`
          (function() {
            const element = document.elementFromPoint(${step.coordinates!.x}, ${step.coordinates!.y});
            if (!element) {
              throw new Error('No element at coordinates ${step.coordinates!.x}, ${step.coordinates!.y}');
            }
            element.click();
            return true;
          })()
        `);
      } else {
        throw new Error('Click step requires either selector or coordinates');
      }

      console.log(`✓ Clicked: ${step.description}`);
    } catch (error) {
      throw new Error(`Click failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeInput(browserWindow: BrowserWindow, step: OperationStep): Promise<void> {
    if (!step.selector || !step.value) {
      throw new Error('Input step requires selector and value');
    }

    try {
      await browserWindow.webContents.executeJavaScript(`
        (function() {
          const element = document.querySelector('${step.selector}');
          if (!element) {
            throw new Error('Input element not found: ${step.selector}');
          }
          element.focus();
          element.value = '${step.value}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()
      `);

      console.log(`✓ Input: ${step.description} = "${step.value}"`);
    } catch (error) {
      throw new Error(`Input failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeWait(step: OperationStep): Promise<void> {
    const waitTime = step.waitTime || 2000;
    console.log(`⏱️ Waiting ${waitTime}ms: ${step.description}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async executeNavigate(browserWindow: BrowserWindow, step: OperationStep): Promise<void> {
    if (!step.value) {
      throw new Error('Navigate step requires URL in value field');
    }

    try {
      await browserWindow.loadURL(step.value);
      console.log(`🧭 Navigated to: ${step.value}`);
    } catch (error) {
      throw new Error(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeVerify(browserWindow: BrowserWindow, step: OperationStep): Promise<void> {
    if (!step.selector) {
      throw new Error('Verify step requires selector');
    }

    try {
      const found = await browserWindow.webContents.executeJavaScript(`
        document.querySelector('${step.selector}') !== null
      `);

      if (!found) {
        throw new Error(`Verification failed: Element not found: ${step.selector}`);
      }

      console.log(`✓ Verified: ${step.description}`);
    } catch (error) {
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}