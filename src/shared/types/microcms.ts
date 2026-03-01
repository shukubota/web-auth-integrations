export interface MicroCMSService {
  id: string;
  name: string;
  subdomain: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MicroCMSAPI {
  id: string;
  name: string;
  type: 'list' | 'object';
  endpoint: string;
  fields: MicroCMSField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MicroCMSField {
  fieldId: string;
  displayName: string;
  kind: 'text' | 'textArea' | 'richEditor' | 'media' | 'date' | 'boolean' | 'select' | 'number' | 'relation';
  required: boolean;
  description?: string;
  selectItems?: string[];
  relationApi?: string;
}

export interface MicroCMSContent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  revisedAt?: Date;
  status: 'draft' | 'published';
  [key: string]: any; // Dynamic fields based on API schema
}

export interface MicroCMSMedia {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  fileName: string;
  mimeType: string;
}

export interface MicroCMSCommand {
  type: 'create_service' | 'create_api' | 'create_content' | 'upload_media' | 'update_content' | 'delete_content';
  target: string; // service name, API endpoint, content ID, etc.
  data?: Record<string, any>;
  options?: {
    draft?: boolean;
    publish?: boolean;
    schedule?: Date;
  };
}

export interface MicroCMSCommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface MicroCMSAuth {
  serviceId: string;
  apiKey: string;
  baseUrl: string;
  isValid: boolean;
  lastVerified?: Date;
}

export interface MicroCMSOperation {
  id: string;
  command: MicroCMSCommand;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: MicroCMSCommandResult;
  startTime: Date;
  endTime?: Date;
}