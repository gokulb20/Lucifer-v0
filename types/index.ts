export enum GrokModel {
  GROK_4 = "grok-4-latest"
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: Role;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export type Role = "assistant" | "user" | "system" | "tool";
