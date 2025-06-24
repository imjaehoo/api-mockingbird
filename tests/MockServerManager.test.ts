import { existsSync, rmSync } from 'fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HTTP_STATUS } from '../src/constants.js';
import { MockServerManager } from '../src/services/MockServerManager.js';
import { MockEndpoint, MockServerConfig } from '../src/types/index.js';
import { delay } from '../src/utils/delay.js';

describe('MockServerManager', () => {
  let manager: MockServerManager;
  const testPort = 9876;
  const configDir = '.api-mockingbird.local';

  beforeEach(() => {
    manager = new MockServerManager();
  });

  afterEach(async () => {
    try {
      await manager.stopServer(testPort);
      await manager.stopServer(testPort + 1); // For multi-server tests
    } catch (error) {
      // Ignore cleanup errors
    }

    // Add small delay to ensure servers are fully stopped
    await delay(50);

    try {
      if (existsSync(configDir)) {
        rmSync(configDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('startServer', () => {
    it('should start a server on the specified port', async () => {
      const config: MockServerConfig = { port: testPort };
      const server = await manager.startServer(config);

      expect(server.port).toBe(testPort);
      expect(server.isRunning).toBe(true);
      expect(server.endpoints).toEqual([]);
    });

    it('should throw error if server already running on port', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      await expect(manager.startServer(config)).rejects.toThrow(
        `Server already running on port ${testPort}`
      );
    });
  });

  describe('stopServer', () => {
    it('should stop a running server', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const stopped = await manager.stopServer(testPort);
      expect(stopped).toBe(true);
    });

    it('should return false if no server running on port', async () => {
      const stopped = await manager.stopServer(testPort);
      expect(stopped).toBe(false);
    });
  });

  describe('getServerStatus', () => {
    it('should return server status if exists', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const status = manager.getServerStatus(testPort);
      expect(status).not.toBeNull();
      expect(status?.port).toBe(testPort);
      expect(status?.isRunning).toBe(true);
    });

    it('should return null if server does not exist', () => {
      const status = manager.getServerStatus(testPort);
      expect(status).toBeNull();
    });
  });

  describe('getAllServers', () => {
    it('should return empty array when no servers', () => {
      const servers = manager.getAllServers();
      expect(servers).toEqual([]);
    });

    it('should return all running servers', async () => {
      const config1: MockServerConfig = { port: testPort };
      const config2: MockServerConfig = { port: testPort + 1 };

      await manager.startServer(config1);
      await manager.startServer(config2);

      const servers = manager.getAllServers();
      expect(servers).toHaveLength(2);
      expect(servers.map((s) => s.port)).toContain(testPort);
      expect(servers.map((s) => s.port)).toContain(testPort + 1);

      await manager.stopServer(testPort + 1);
    });
  });

  describe('addEndpoint', () => {
    beforeEach(async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);
    });

    it('should add endpoint to running server', async () => {
      const endpoint: MockEndpoint = {
        id: 'test-id',
        method: 'GET',
        path: '/test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'test' },
        },
      };

      const success = await manager.addEndpoint(testPort, endpoint);
      expect(success).toBe(true);

      const server = manager.getServerStatus(testPort);
      expect(server?.endpoints).toHaveLength(1);
      expect(server?.endpoints[0]).toEqual(endpoint);
    });

    it('should return false if server not running', async () => {
      const endpoint: MockEndpoint = {
        id: 'test-id',
        method: 'GET',
        path: '/test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'test' },
        },
      };

      const success = await manager.addEndpoint(9999, endpoint);
      expect(success).toBe(false);
    });

    it('should replace existing endpoint with same method and path', async () => {
      const endpoint1: MockEndpoint = {
        id: 'test-id-1',
        method: 'GET',
        path: '/test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'first' },
        },
      };

      const endpoint2: MockEndpoint = {
        id: 'test-id-2',
        method: 'GET',
        path: '/test',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'second' },
        },
      };

      await manager.addEndpoint(testPort, endpoint1);
      await manager.addEndpoint(testPort, endpoint2);

      const server = manager.getServerStatus(testPort);
      expect(server?.endpoints).toHaveLength(1);
      expect(server?.endpoints[0].response.body).toEqual({ message: 'second' });
    });
  });

  describe('removeEndpoint', () => {
    beforeEach(async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);
    });

    it('should remove endpoint from server', async () => {
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
      const success = await manager.removeEndpoint(testPort, 'GET', '/test');

      expect(success).toBe(true);
      const server = manager.getServerStatus(testPort);
      expect(server?.endpoints).toHaveLength(0);
    });

    it('should return false if server does not exist', async () => {
      const success = await manager.removeEndpoint(9999, 'GET', '/test');
      expect(success).toBe(false);
    });

    it('should handle case-insensitive method matching', async () => {
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
      const success = await manager.removeEndpoint(testPort, 'get', '/test');

      expect(success).toBe(true);
      const server = manager.getServerStatus(testPort);
      expect(server?.endpoints).toHaveLength(0);
    });
  });

  describe('setEndpointError', () => {
    beforeEach(async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);
    });

    it('should set error response for existing endpoint', async () => {
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
      const success = await manager.setEndpointError(
        testPort,
        'GET',
        '/test',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Test error'
      );

      expect(success).toBe(true);
      const server = manager.getServerStatus(testPort);
      const updatedEndpoint = server?.endpoints[0];
      expect(updatedEndpoint?.errorResponse).toEqual({
        enabled: true,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Test error',
      });
    });

    it('should return false if endpoint does not exist', async () => {
      const success = await manager.setEndpointError(
        testPort,
        'GET',
        '/nonexistent',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Test error'
      );

      expect(success).toBe(false);
    });
  });

  describe('toggleEndpointError', () => {
    beforeEach(async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);
    });

    it('should toggle error response for endpoint with error configured', async () => {
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
      await manager.setEndpointError(
        testPort,
        'GET',
        '/test',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Test error'
      );

      const success = await manager.toggleEndpointError(
        testPort,
        'GET',
        '/test',
        false
      );
      expect(success).toBe(true);

      const server = manager.getServerStatus(testPort);
      expect(server?.endpoints[0].errorResponse?.enabled).toBe(false);
    });

    it('should return false if endpoint has no error response configured', async () => {
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
      const success = await manager.toggleEndpointError(
        testPort,
        'GET',
        '/test',
        true
      );

      expect(success).toBe(false);
    });
  });

  describe('Endpoint Delay', () => {
    it('should apply delay to endpoint responses', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const endpointWithDelay: MockEndpoint = {
        id: 'test-delay-id',
        method: 'GET',
        path: '/slow',
        response: {
          status: HTTP_STATUS.OK,
          body: { message: 'slow response' },
        },
        delay: 100,
      };

      await manager.addEndpoint(testPort, endpointWithDelay);

      const start = Date.now();
      const response = await fetch(`http://localhost:${testPort}/slow`);
      const duration = Date.now() - start;

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(duration).toBeGreaterThanOrEqual(90);

      const data = await response.json();
      expect(data).toEqual({ message: 'slow response' });
    });

    it('should return correct response body for endpoint', async () => {
      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const testBody = { message: 'test response', data: [1, 2, 3] };
      const endpoint: MockEndpoint = {
        id: 'test-body-id',
        method: 'GET',
        path: '/test-body',
        response: {
          status: HTTP_STATUS.OK,
          body: testBody,
        },
      };

      await manager.addEndpoint(testPort, endpoint);

      const response = await fetch(`http://localhost:${testPort}/test-body`);
      expect(response.status).toBe(HTTP_STATUS.OK);

      const data = await response.json();
      expect(data).toEqual(testBody);
    });

    it('should serve endpoints loaded from config file on server start', async () => {
      const configData = {
        port: testPort,
        endpoints: [
          {
            id: 'test-id',
            method: 'GET',
            path: '/api/test',
            response: {
              status: 200,
              body: { ok: true },
              headers: { 'custom-header': 'test' },
            },
            delay: 100,
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      const { existsSync, mkdirSync, writeFileSync } = await import('fs');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(
        `${configDir}/${testPort}.json`,
        JSON.stringify(configData, null, 2)
      );

      const config: MockServerConfig = { port: testPort };
      await manager.startServer(config);

      const start = Date.now();
      const response = await fetch(`http://localhost:${testPort}/api/test`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.headers.get('custom-header')).toBe('test');
      expect(duration).toBeGreaterThanOrEqual(90);

      const data = await response.json();
      expect(data).toEqual({ ok: true });
    });
  });
});
