import {
  MicroCMSAPI,
  MicroCMSContent,
  MicroCMSMedia,
  MicroCMSAuth,
  MicroCMSCommand,
  MicroCMSCommandResult
} from '@shared/types/microcms';

export class MicroCMSConnector {
  private auth: MicroCMSAuth | null = null;
  private baseHeaders = {
    'Content-Type': 'application/json',
  };

  constructor() {}

  async authenticate(serviceId: string, apiKey: string): Promise<boolean> {
    try {
      const baseUrl = `https://${serviceId}.microcms.io`;

      // Test API connection by fetching APIs list
      const response = await fetch(`${baseUrl}/api/v1/apis`, {
        method: 'GET',
        headers: {
          ...this.baseHeaders,
          'X-MICROCMS-API-KEY': apiKey,
        },
      });

      if (response.ok) {
        this.auth = {
          serviceId,
          apiKey,
          baseUrl,
          isValid: true,
          lastVerified: new Date(),
        };
        return true;
      } else {
        console.error('microCMS authentication failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('microCMS authentication error:', error);
      return false;
    }
  }

  async executeCommand(command: MicroCMSCommand): Promise<MicroCMSCommandResult> {
    const startTime = Date.now();

    if (!this.auth) {
      return {
        success: false,
        message: 'microCMSに認証されていません',
        error: 'Not authenticated',
        executionTime: Date.now() - startTime,
      };
    }

    try {
      let result;

      switch (command.type) {
        case 'create_service':
          result = await this.createService(command.data);
          break;

        case 'create_api':
          result = await this.createAPI(command.target, command.data);
          break;

        case 'create_content':
          result = await this.createContent(command.target, command.data, command.options);
          break;

        case 'upload_media':
          result = await this.uploadMedia(command.data);
          break;

        case 'update_content':
          result = await this.updateContent(command.target, command.data, command.options);
          break;

        case 'delete_content':
          result = await this.deleteContent(command.target);
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

  private async createService(_serviceData: any): Promise<any> {
    // Note: Service creation is typically done through microCMS web interface
    // This would require browser automation or direct API access
    throw new Error('サービス作成はmicroCMSの管理画面から行う必要があります');
  }

  private async createAPI(apiName: string, apiData: any): Promise<MicroCMSAPI> {
    const response = await this.makeRequest('POST', '/api/v1/apis', {
      name: apiName,
      type: apiData.type || 'list',
      fields: apiData.fields || [],
      ...apiData,
    });

    return response;
  }

  private async createContent(endpoint: string, contentData: any, options?: any): Promise<MicroCMSContent> {
    const url = `/api/v1/${endpoint}`;
    const response = await this.makeRequest('POST', url, contentData);

    if (options?.publish) {
      // Publish the content immediately
      await this.publishContent(endpoint, response.id);
    }

    return response;
  }

  private async updateContent(endpoint: string, contentData: any, options?: any): Promise<MicroCMSContent> {
    const [apiEndpoint, contentId] = endpoint.split('/');
    const url = `/api/v1/${apiEndpoint}/${contentId}`;

    const response = await this.makeRequest('PATCH', url, contentData);

    if (options?.publish) {
      await this.publishContent(apiEndpoint, contentId);
    }

    return response;
  }

  private async deleteContent(endpoint: string): Promise<void> {
    const [apiEndpoint, contentId] = endpoint.split('/');
    const url = `/api/v1/${apiEndpoint}/${contentId}`;

    await this.makeRequest('DELETE', url);
  }

  private async publishContent(endpoint: string, contentId: string): Promise<void> {
    const url = `/api/v1/${endpoint}/${contentId}/publish`;
    await this.makeRequest('POST', url);
  }

  private async uploadMedia(mediaData: any): Promise<MicroCMSMedia> {
    const formData = new FormData();
    formData.append('file', mediaData.file);

    const response = await fetch(`${this.auth!.baseUrl}/api/v1/media`, {
      method: 'POST',
      headers: {
        'X-MICROCMS-API-KEY': this.auth!.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Media upload failed: ${response.status}`);
    }

    return await response.json();
  }

  async listAPIs(): Promise<MicroCMSAPI[]> {
    return await this.makeRequest('GET', '/api/v1/apis');
  }

  async getContent(endpoint: string, contentId?: string): Promise<MicroCMSContent | MicroCMSContent[]> {
    const url = contentId
      ? `/api/v1/${endpoint}/${contentId}`
      : `/api/v1/${endpoint}`;

    return await this.makeRequest('GET', url);
  }

  async listMedia(): Promise<MicroCMSMedia[]> {
    return await this.makeRequest('GET', '/api/v1/media');
  }

  private async makeRequest(method: string, path: string, body?: any): Promise<any> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.auth.baseUrl}${path}`, {
      method,
      headers: {
        ...this.baseHeaders,
        'X-MICROCMS-API-KEY': this.auth.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  getAuthStatus(): MicroCMSAuth | null {
    return this.auth;
  }

  disconnect(): void {
    this.auth = null;
  }
}