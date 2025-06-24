import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MockServerManager } from '../src/services/MockServerManager.js';
import { handleAddEndpoint } from '../src/tools/addEndpoint.js';
import { handleListEndpoints } from '../src/tools/listEndpoints.js';
import { handleRemoveEndpoint } from '../src/tools/removeEndpoint.js';
import { handleStartMockServer } from '../src/tools/startMockServer.js';
import { handleStopMockServer } from '../src/tools/stopMockServer.js';

describe('Tool Handlers', () => {
  let mockServerManager: MockServerManager;

  beforeEach(() => {
    mockServerManager = new MockServerManager();
  });

  describe('handleStartMockServer', () => {
    it('should start server successfully', async () => {
      const mockServer = {
        port: 9878,
        endpoints: [],
        isRunning: true,
        instance: undefined,
      };

      vi.spyOn(mockServerManager, 'startServer').mockResolvedValue(mockServer);

      const result = await handleStartMockServer(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain(
        'Mock server started successfully'
      );
      expect(result.content[0].text).toContain('port 9878');
      expect(mockServerManager.startServer).toHaveBeenCalledWith({
        port: 9878,
      });
    });

    it('should handle server startup failure', async () => {
      vi.spyOn(mockServerManager, 'startServer').mockRejectedValue(
        new Error('Port already in use')
      );

      const result = await handleStartMockServer(mockServerManager, {
        port: 9878,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to start mock server');
      expect(result.content[0].text).toContain('Port already in use');
    });

    it('should validate port range', async () => {
      const result = await handleStartMockServer(mockServerManager, {
        port: 500,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        'Port must be between 1024 and 65535'
      );
    });
  });

  describe('handleStopMockServer', () => {
    it('should stop server successfully', async () => {
      vi.spyOn(mockServerManager, 'stopServer').mockResolvedValue(true);

      const result = await handleStopMockServer(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain(
        'Mock server on port 9878 stopped successfully'
      );
      expect(mockServerManager.stopServer).toHaveBeenCalledWith(9878);
    });

    it('should handle when no server is running', async () => {
      vi.spyOn(mockServerManager, 'stopServer').mockResolvedValue(false);

      const result = await handleStopMockServer(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain(
        'No running server found on port 9878'
      );
    });

    it('should validate port range', async () => {
      const result = await handleStopMockServer(mockServerManager, {
        port: 70000,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        'Port must be between 1024 and 65535'
      );
    });
  });

  describe('handleAddEndpoint', () => {
    it('should add endpoint successfully', async () => {
      vi.spyOn(mockServerManager, 'addEndpoint').mockResolvedValue(true);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
        response: {
          body: { message: 'test' },
        },
      };

      const result = await handleAddEndpoint(mockServerManager, args);

      expect(result.content[0].text).toContain('Endpoint added successfully');
      expect(result.content[0].text).toContain('GET /test');
      expect(mockServerManager.addEndpoint).toHaveBeenCalled();
    });

    it('should handle when server is not running', async () => {
      vi.spyOn(mockServerManager, 'addEndpoint').mockResolvedValue(false);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
        response: {
          body: { message: 'test' },
        },
      };

      const result = await handleAddEndpoint(mockServerManager, args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        'No running server found on port 9878'
      );
    });

    it('should use default status code when not provided', async () => {
      vi.spyOn(mockServerManager, 'addEndpoint').mockResolvedValue(true);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
        response: {
          body: { message: 'test' },
        },
      };

      await handleAddEndpoint(mockServerManager, args);

      const addEndpointCall = vi.mocked(mockServerManager.addEndpoint).mock
        .calls[0];
      const endpoint = addEndpointCall[1];
      expect(endpoint.response.status).toBe(200);
    });

    it('should add endpoint with delay', async () => {
      vi.spyOn(mockServerManager, 'addEndpoint').mockResolvedValue(true);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
        response: {
          body: { message: 'test' },
        },
        delay: 1000,
      };

      const result = await handleAddEndpoint(mockServerManager, args);

      expect(result.content[0].text).toContain('Endpoint added successfully');
      expect(result.content[0].text).toContain('Delay: 1000ms');

      const addEndpointCall = vi.mocked(mockServerManager.addEndpoint).mock
        .calls[0];
      const endpoint = addEndpointCall[1];
      expect(endpoint.delay).toBe(1000);
    });

    it('should add endpoint without delay when not provided', async () => {
      vi.spyOn(mockServerManager, 'addEndpoint').mockResolvedValue(true);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
        response: {
          body: { message: 'test' },
        },
      };

      await handleAddEndpoint(mockServerManager, args);

      const addEndpointCall = vi.mocked(mockServerManager.addEndpoint).mock
        .calls[0];
      const endpoint = addEndpointCall[1];
      expect(endpoint.delay).toBeUndefined();
    });
  });

  describe('handleRemoveEndpoint', () => {
    it('should remove endpoint successfully', async () => {
      vi.spyOn(mockServerManager, 'removeEndpoint').mockResolvedValue(true);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
      };

      const result = await handleRemoveEndpoint(mockServerManager, args);

      expect(result.content[0].text).toContain('Endpoint removed successfully');
      expect(result.content[0].text).toContain('GET /test');
      expect(mockServerManager.removeEndpoint).toHaveBeenCalledWith(
        9878,
        'GET',
        '/test'
      );
    });

    it('should handle when endpoint not found', async () => {
      vi.spyOn(mockServerManager, 'removeEndpoint').mockResolvedValue(false);

      const args = {
        port: 9878,
        method: 'GET',
        path: '/test',
      };

      const result = await handleRemoveEndpoint(mockServerManager, args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        "Server not found on port 9878 or endpoint doesn't exist"
      );
    });
  });

  describe('handleListEndpoints', () => {
    it('should list endpoints when server has endpoints', async () => {
      const mockServer = {
        port: 9878,
        endpoints: [
          {
            id: '1',
            method: 'GET' as const,
            path: '/test',
            response: { status: 200, body: { message: 'test' } },
          },
          {
            id: '2',
            method: 'POST' as const,
            path: '/users',
            response: { status: 201, body: { id: 1 } },
          },
        ],
        isRunning: true,
        instance: undefined,
      };

      vi.spyOn(mockServerManager, 'getServerStatus').mockReturnValue(
        mockServer
      );

      const result = await handleListEndpoints(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain('Endpoints (2)');
      expect(result.content[0].text).toContain('GET /test');
      expect(result.content[0].text).toContain('POST /users');
    });

    it('should handle when server has no endpoints', async () => {
      const mockServer = {
        port: 9878,
        endpoints: [],
        isRunning: true,
        instance: undefined,
      };

      vi.spyOn(mockServerManager, 'getServerStatus').mockReturnValue(
        mockServer
      );

      const result = await handleListEndpoints(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain('No endpoints configured');
    });

    it('should handle when server is not running', async () => {
      vi.spyOn(mockServerManager, 'getServerStatus').mockReturnValue(null);

      const result = await handleListEndpoints(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain('No server found on port 9878');
    });

    it('should display delay information when endpoints have delays', async () => {
      const mockServer = {
        port: 9878,
        endpoints: [
          {
            id: '1',
            method: 'GET' as const,
            path: '/fast',
            response: { status: 200, body: { message: 'fast' } },
          },
          {
            id: '2',
            method: 'POST' as const,
            path: '/slow',
            response: { status: 201, body: { id: 1 } },
            delay: 2000,
          },
        ],
        isRunning: true,
        instance: undefined,
      };

      vi.spyOn(mockServerManager, 'getServerStatus').mockReturnValue(
        mockServer
      );

      const result = await handleListEndpoints(mockServerManager, {
        port: 9878,
      });

      expect(result.content[0].text).toContain('GET /fast → 200');
      expect(result.content[0].text).toContain(
        'POST /slow → 201 [Delay: 2000ms]'
      );
      expect(result.content[0].text).not.toContain('GET /fast → 200 [Delay:');
    });
  });
});
