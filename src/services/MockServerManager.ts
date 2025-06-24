import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { HTTP_STATUS } from '../constants.js';
import {
  MockEndpoint,
  MockServer,
  MockServerConfig,
  MockServerInstance,
} from '../types/index.js';
import { delay } from '../utils/delay.js';

export class MockServerManager {
  private servers: Map<number, MockServer> = new Map();
  private configDir = '.api-mockingbird.local';

  async startServer(config: MockServerConfig): Promise<MockServer> {
    if (this.servers.has(config.port)) {
      const existing = this.servers.get(config.port);
      if (existing && existing.isRunning) {
        throw new Error(`Server already running on port ${config.port}`);
      }
    }

    const app: Express = express();

    app.use(cors());
    app.use(express.json());

    const server = app.listen(config.port);

    const instance: MockServerInstance = { app, server };
    const mockServer: MockServer = {
      port: config.port,
      endpoints: [],
      isRunning: true,
      instance,
    };

    this.servers.set(config.port, mockServer);

    await this.loadEndpoints(config.port);

    return mockServer;
  }

  async stopServer(port: number): Promise<boolean> {
    const mockServer = this.servers.get(port);
    if (!mockServer || !mockServer.isRunning || !mockServer.instance) {
      return false;
    }

    return new Promise((resolve) => {
      if (mockServer.instance) {
        mockServer.instance.server.close(() => {
          mockServer.isRunning = false;
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }

  async addEndpoint(port: number, endpoint: MockEndpoint): Promise<boolean> {
    const mockServer = this.servers.get(port);
    if (!mockServer || !mockServer.isRunning || !mockServer.instance) {
      return false;
    }

    this.registerEndpointRoute(mockServer, endpoint);

    mockServer.endpoints = mockServer.endpoints.filter(
      (ep) => !(ep.method === endpoint.method && ep.path === endpoint.path)
    );

    mockServer.endpoints.push(endpoint);

    await this.saveEndpoints(port);

    return true;
  }

  async removeEndpoint(
    port: number,
    method: string,
    path: string
  ): Promise<boolean> {
    const mockServer = this.servers.get(port);
    if (!mockServer) {
      return false;
    }

    mockServer.endpoints = mockServer.endpoints.filter(
      (ep) => !(ep.method === method.toUpperCase() && ep.path === path)
    );

    await this.saveEndpoints(port);

    return true;
  }

  getServerStatus(port: number): MockServer | null {
    return this.servers.get(port) ?? null;
  }

  getAllServers(): MockServer[] {
    return Array.from(this.servers.values());
  }

  async setEndpointError(
    port: number,
    method: string,
    path: string,
    status: number,
    message: string
  ): Promise<boolean> {
    const mockServer = this.servers.get(port);
    if (!mockServer) {
      return false;
    }

    const endpoint = mockServer.endpoints.find(
      (ep) => ep.method === method.toUpperCase() && ep.path === path
    );

    if (!endpoint) {
      return false;
    }

    endpoint.errorResponse = {
      enabled: true,
      status,
      message,
    };

    await this.saveEndpoints(port);
    return true;
  }

  async toggleEndpointError(
    port: number,
    method: string,
    path: string,
    enabled: boolean
  ): Promise<boolean> {
    const mockServer = this.servers.get(port);
    if (!mockServer) {
      return false;
    }

    const endpoint = mockServer.endpoints.find(
      (ep) => ep.method === method.toUpperCase() && ep.path === path
    );

    if (!endpoint || !endpoint.errorResponse) {
      return false;
    }

    endpoint.errorResponse.enabled = enabled;
    await this.saveEndpoints(port);
    return true;
  }

  async saveEndpoints(port: number): Promise<void> {
    const mockServer = this.servers.get(port);
    if (!mockServer) {
      return;
    }

    if (!existsSync(this.configDir)) {
      await mkdir(this.configDir, { recursive: true });
    }

    const config = {
      port,
      endpoints: mockServer.endpoints,
      updatedAt: new Date().toISOString(),
    };

    const configPath = join(this.configDir, `${port}.json`);
    await writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private async loadEndpoints(port: number): Promise<void> {
    const configPath = join(this.configDir, `${port}.json`);

    if (!existsSync(configPath)) return;

    try {
      const data = await readFile(configPath, 'utf-8');
      const config = JSON.parse(data);

      if (config.endpoints && config.endpoints.length > 0) {
        const mockServer = this.servers.get(port);
        if (mockServer) {
          for (const endpoint of config.endpoints) {
            this.registerEndpointRoute(mockServer, endpoint);
            mockServer.endpoints.push(endpoint);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load config for port ${port}:`, error);
    }
  }

  private registerEndpointRoute(
    mockServer: MockServer,
    endpoint: MockEndpoint
  ): void {
    if (!mockServer.instance) {
      throw new Error('Server instance not available');
    }
    const { app } = mockServer.instance;
    const method = endpoint.method.toLowerCase() as keyof Express;

    app[method](endpoint.path, async (_req: Request, res: Response) => {
      try {
        if (endpoint.delay && endpoint.delay > 0) {
          await delay(endpoint.delay);
        }

        if (endpoint.errorResponse?.enabled) {
          return res.status(endpoint.errorResponse.status).json({
            error: endpoint.errorResponse.message,
          });
        }

        if (endpoint.response.headers) {
          Object.entries(endpoint.response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }

        res.status(endpoint.response.status).json(endpoint.response.body);
      } catch {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ error: 'Internal server error' });
      }
    });
  }
}
