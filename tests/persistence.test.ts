import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HTTP_STATUS } from '../src/constants.js';
import { MockServerManager } from '../src/services/MockServerManager.js';
import { MockEndpoint, MockServerConfig } from '../src/types/index.js';

describe('Configuration Persistence', () => {
  let manager: MockServerManager;
  const testPort = 9878;
  const configDir = '.api-mockingbird.local';
  const configFile = join(configDir, `${testPort}.json`);

  beforeEach(() => {
    manager = new MockServerManager();
  });

  afterEach(async () => {
    try {
      await manager.stopServer(testPort);
    } catch (error) {
      // Ignore cleanup errors
    }

    try {
      if (existsSync(configDir)) {
        rmSync(configDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('saveEndpoints', () => {
    it('should create config directory if it does not exist', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint: MockEndpoint = {
        id: 'test-id',
        method: 'GET',
        path: '/test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'test' },
        },
      };

      await manager.addEndpoint(testPort, endpoint);

      expect(existsSync(configDir)).toBe(true);
      expect(existsSync(configFile)).toBe(true);
    });

    it('should save endpoint configuration to JSON file', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint: MockEndpoint = {
        id: 'test-id',
        method: 'POST',
        path: '/api/users',
        response: {
          status: 201,
          body: { id: 1, name: 'John' },
          headers: { 'Content-Type': 'application/json' },
        },
      };

      await manager.addEndpoint(testPort, endpoint);

      const configContent = JSON.parse(readFileSync(configFile, 'utf-8'));

      expect(configContent.port).toBe(testPort);
      expect(configContent.endpoints).toHaveLength(1);
      expect(configContent.endpoints[0]).toEqual(endpoint);
      expect(configContent.updatedAt).toBeDefined();
    });

    it('should save multiple endpoints correctly', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint1: MockEndpoint = {
        id: 'test-id-1',
        method: 'GET',
        path: '/users',
        response: {
          status: HTTP_STATUS.OK,
          body: [{ id: 1, name: 'John' }],
        },
      };

      const endpoint2: MockEndpoint = {
        id: 'test-id-2',
        method: 'POST',
        path: '/users',
        response: {
          status: 201,
          body: { success: true },
        },
      };

      await manager.addEndpoint(testPort, endpoint1);
      await manager.addEndpoint(testPort, endpoint2);

      const configContent = JSON.parse(readFileSync(configFile, 'utf-8'));

      expect(configContent.endpoints).toHaveLength(2);
      expect(configContent.endpoints).toContainEqual(endpoint1);
      expect(configContent.endpoints).toContainEqual(endpoint2);
    });

    it('should save endpoints with error responses', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint: MockEndpoint = {
        id: 'test-id',
        method: 'GET',
        path: '/error-test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'success' },
        },
      };

      await manager.addEndpoint(testPort, endpoint);
      await manager.setEndpointError(
        testPort,
        'GET',
        '/error-test',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Test error message'
      );

      const configContent = JSON.parse(readFileSync(configFile, 'utf-8'));
      const savedEndpoint = configContent.endpoints[0];

      expect(savedEndpoint.errorResponse).toEqual({
        enabled: true,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Test error message',
      });
    });

    it('should update config file when endpoints are removed', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint1: MockEndpoint = {
        id: 'test-id-1',
        method: 'GET',
        path: '/keep',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'keep me' },
        },
      };

      const endpoint2: MockEndpoint = {
        id: 'test-id-2',
        method: 'DELETE',
        path: '/remove',
        response: {
          status: 204,
          body: null,
        },
      };

      await manager.addEndpoint(testPort, endpoint1);
      await manager.addEndpoint(testPort, endpoint2);

      let configContent = JSON.parse(readFileSync(configFile, 'utf-8'));
      expect(configContent.endpoints).toHaveLength(2);

      await manager.removeEndpoint(testPort, 'DELETE', '/remove');

      configContent = JSON.parse(readFileSync(configFile, 'utf-8'));
      expect(configContent.endpoints).toHaveLength(1);
      expect(configContent.endpoints[0].path).toBe('/keep');
    });
  });

  describe('loadEndpoints', () => {
    it('should load endpoints from existing config file on server start', async () => {
      const existingConfig = {
        port: testPort,
        endpoints: [
          {
            id: 'existing-id',
            method: 'GET',
            path: '/existing',
            response: {
              status: HTTP_STATUS.OK,
              body: { message: 'loaded from file' },
            },
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(configFile, JSON.stringify(existingConfig, null, 2));

      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.endpoints).toHaveLength(1);
      expect(server.endpoints[0]).toEqual(existingConfig.endpoints[0]);
    });

    it('should handle missing config file gracefully', async () => {
      if (existsSync(configFile)) {
        rmSync(configFile);
      }

      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.endpoints).toHaveLength(0);
    });

    it('should handle invalid JSON in config file', async () => {
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(configFile, '{ invalid json }');

      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.endpoints).toHaveLength(0);
    });

    it('should load endpoints with error responses correctly', async () => {
      const existingConfig = {
        port: testPort,
        endpoints: [
          {
            id: 'error-endpoint-id',
            method: 'POST',
            path: '/error-endpoint',
            response: {
              status: HTTP_STATUS.OK,
              body: { success: true },
            },
            errorResponse: {
              enabled: false,
              status: 400,
              message: 'Validation error',
            },
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(configFile, JSON.stringify(existingConfig, null, 2));

      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.endpoints).toHaveLength(1);
      expect(server.endpoints[0].errorResponse).toEqual({
        enabled: false,
        status: 400,
        message: 'Validation error',
      });
    });

    it('should handle config file with empty endpoints array', async () => {
      const existingConfig = {
        port: testPort,
        endpoints: [],
        updatedAt: new Date().toISOString(),
      };

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(configFile, JSON.stringify(existingConfig, null, 2));

      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.endpoints).toHaveLength(0);
    });
  });

  describe('persistence integration', () => {
    it('should persist and reload endpoints across server restarts', async () => {
      let config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint: MockEndpoint = {
        id: 'persist-test-id',
        method: 'PUT',
        path: '/persist-test',
        response: {
          status: HTTP_STATUS.OK,
          body: { persisted: true },
          headers: { 'X-Custom': 'header-value' },
        },
      };

      await manager.addEndpoint(testPort, endpoint);

      await manager.stopServer(testPort);

      config = { port: testPort };
      const newServer = await manager.startServer(config);

      expect(newServer.endpoints).toHaveLength(1);
      expect(newServer.endpoints[0]).toEqual(endpoint);
    });

    it('should maintain endpoint modifications across restarts', async () => {
      let config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpoint: MockEndpoint = {
        id: 'modify-test-id',
        method: 'GET',
        path: '/modify-test',
        response: {
          status: HTTP_STATUS.OK,
          body: { initial: true },
        },
      };

      await manager.addEndpoint(testPort, endpoint);

      await manager.setEndpointError(
        testPort,
        'GET',
        '/modify-test',
        403,
        'Access denied'
      );

      await manager.stopServer(testPort);
      config = { port: testPort };
      const newServer = await manager.startServer(config);

      expect(newServer.endpoints[0].errorResponse).toEqual({
        enabled: true,
        status: 403,
        message: 'Access denied',
      });
    });
  });
});
