import { Service1Task, Service2Task, TaskDependency, ExecutionResult } from './services';

export interface TaskPlan {
  id: string;
  instruction: string;
  service1Tasks: Service1Task[];
  service2Tasks: Service2Task[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
  createdAt: Date;
}

export interface TaskExecution {
  id: string;
  planId: string;
  status: "pending" | "executing" | "completed" | "failed" | "cancelled";
  currentTask?: string;
  progress: number;
  results: ExecutionResult[];
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface ProgressUpdate {
  executionId: string;
  progress: number;
  currentTask: string;
  message: string;
  timestamp: Date;
}