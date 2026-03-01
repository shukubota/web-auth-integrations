export interface MasterData {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  validFrom?: Date;
  validUntil?: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ServiceConfig {
  configName: string;
  configType: string;
  targetCriteria: Record<string, any>;
  settings: Record<string, any>;
  schedule?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface Service1Task {
  type: "create" | "update" | "delete" | "get";
  data: MasterData;
  filters?: Record<string, any>;
}

export interface Service2Task {
  type: "create_config" | "update_config" | "activate_config" | "delete_config";
  configData: ServiceConfig;
  dependencies?: string[];
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  status: "pending" | "ready" | "completed" | "failed";
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}