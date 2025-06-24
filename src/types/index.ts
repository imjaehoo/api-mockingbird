import type { Express } from 'express';
import type { Server } from 'http';

export interface MockEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: {
    status: number;
    headers?: Record<string, string>;
    body: unknown;
  };
  delay?: number;
  errorResponse?: {
    enabled: boolean;
    status: number;
    message: string;
  };
}

export interface MockServerInstance {
  app: Express;
  server: Server;
}

export interface MockServer {
  port: number;
  endpoints: MockEndpoint[];
  isRunning: boolean;
  instance?: MockServerInstance;
}

export interface MockServerConfig {
  port: number;
}

export interface EndpointRequest {
  method: string;
  path: string;
  response: {
    status?: number;
    body: unknown;
    headers?: Record<string, string>;
  };
}

export interface ToolArgs {
  [key: string]: unknown;
}
