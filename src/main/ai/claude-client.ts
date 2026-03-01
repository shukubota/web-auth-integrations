import Anthropic from '@anthropic-ai/sdk';

export interface ScreenAnalysisResult {
  action: string;
  reasoning: string;
  steps: OperationStep[];
  success: boolean;
  message: string;
}

export interface OperationStep {
  type: 'click' | 'input' | 'wait' | 'navigate' | 'verify';
  selector?: string;
  value?: string;
  coordinates?: { x: number; y: number };
  waitTime?: number;
  description: string;
}

export class ClaudeAIClient {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeScreenAndPlan(
    screenshot: Buffer,
    userInstruction: string,
    pageContext: any
  ): Promise<ScreenAnalysisResult> {
    try {
      const base64Screenshot = screenshot.toString('base64');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        system: `You are an AI automation agent for microCMS. You analyze webpage screenshots and create step-by-step automation plans.

CONTEXT:
- You're viewing a microCMS management interface
- User wants to: ${userInstruction}
- Current page info: ${JSON.stringify(pageContext)}

CAPABILITIES:
- Click buttons/links (provide CSS selector or coordinates)
- Fill input fields (provide selector and value)
- Navigate to URLs
- Wait for page loads
- Verify results

RESPONSE FORMAT (JSON):
{
  "action": "brief description of what you're doing",
  "reasoning": "why this approach will work",
  "steps": [
    {
      "type": "click|input|wait|navigate|verify",
      "selector": "CSS selector (if applicable)",
      "value": "input value (for input type)",
      "coordinates": {"x": 100, "y": 200},
      "waitTime": 2000,
      "description": "human readable step description"
    }
  ],
  "success": true,
  "message": "explanation of the plan"
}

IMPORTANT:
- Analyze the screenshot carefully to find the right elements
- Prefer CSS selectors over coordinates when possible
- Include wait times for page loads
- If you can't find required elements, set success: false
- Be specific about button text, field labels, etc.
- Consider the typical microCMS interface patterns`,

        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this microCMS screenshot and create an automation plan for: "${userInstruction}"

Current page context:
- URL: ${pageContext.url}
- Title: ${pageContext.title}
- Page type: ${pageContext.pageType || 'unknown'}

Return a JSON response with the automation steps.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Screenshot
                }
              }
            ]
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from Claude's response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const result = JSON.parse(jsonMatch[0]);
      return result as ScreenAnalysisResult;

    } catch (error) {
      console.error('Claude API error:', error);
      return {
        action: 'error',
        reasoning: 'Failed to analyze screenshot',
        steps: [],
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyResult(
    screenshot: Buffer,
    expectedResult: string,
    previousSteps: OperationStep[]
  ): Promise<{ success: boolean; message: string; nextSteps?: OperationStep[] }> {
    try {
      const base64Screenshot = screenshot.toString('base64');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: `You are verifying the result of automation steps in microCMS.

TASK: Check if the previous automation steps achieved the expected result.

RESPONSE FORMAT (JSON):
{
  "success": true/false,
  "message": "description of current state",
  "nextSteps": [optional additional steps if needed]
}`,

        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please verify if this result matches the expectation:

Expected: ${expectedResult}
Previous steps: ${JSON.stringify(previousSteps)}

Look at the current screenshot and determine if the operation was successful.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Screenshot
                }
              }
            ]
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude verification response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Claude verification error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  async adaptToError(
    screenshot: Buffer,
    errorMessage: string,
    originalInstruction: string,
    failedSteps: OperationStep[]
  ): Promise<ScreenAnalysisResult> {
    try {
      const base64Screenshot = screenshot.toString('base64');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        system: `You are recovering from an automation error in microCMS.

The previous automation attempt failed. Analyze the current state and create a new plan.

RESPONSE FORMAT: Same JSON format as initial analysis.`,

        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `An automation error occurred. Please analyze the current state and create a recovery plan.

Original instruction: ${originalInstruction}
Error: ${errorMessage}
Failed steps: ${JSON.stringify(failedSteps)}

What should we do now to complete the original task?`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Screenshot
                }
              }
            ]
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude recovery response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Claude adaptation error:', error);
      return {
        action: 'error_recovery_failed',
        reasoning: 'Could not recover from error',
        steps: [],
        success: false,
        message: error instanceof Error ? error.message : 'Recovery failed'
      };
    }
  }
}