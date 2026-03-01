export interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system" | "error";
  content: string;
  timestamp: Date;
  taskId?: string;
  metadata?: Record<string, any>;
}

export interface ChatInstruction {
  message: string;
  timestamp: Date;
  userId: string;
}

export interface TaskConfirmation {
  planId: string;
  instruction: string;
  summary: string;
  tasks: {
    service1: string[];
    service2: string[];
  };
  estimatedDuration: number;
  requiresApproval: boolean;
}