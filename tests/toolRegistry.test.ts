import { describe, expect, it } from 'vitest';

import {
  TOOL_REGISTRY,
  getAllTools,
  getToolHandler,
  isValidToolName,
} from '../src/tools/registry.js';

describe('Tool Registry', () => {
  describe('TOOL_REGISTRY', () => {
    it('should contain all expected tools', () => {
      const expectedToolNames = [
        'start_mock_server',
        'stop_mock_server',
        'add_endpoint',
        'remove_endpoint',
        'list_endpoints',
        'set_endpoint_error',
        'toggle_endpoint_error',
      ];

      const registryKeys = Object.keys(TOOL_REGISTRY);
      expect(registryKeys).toHaveLength(expectedToolNames.length);

      expectedToolNames.forEach((toolName) => {
        expect(registryKeys).toContain(toolName);
      });
    });

    it('should have matching tool names as keys and tool.name properties', () => {
      Object.entries(TOOL_REGISTRY).forEach(([key, entry]) => {
        expect(key).toBe(entry.tool.name);
      });
    });

    it('should have all entries with tool and handler properties', () => {
      Object.values(TOOL_REGISTRY).forEach((entry) => {
        expect(entry).toHaveProperty('tool');
        expect(entry).toHaveProperty('handler');
        expect(typeof entry.handler).toBe('function');
        expect(entry.tool).toHaveProperty('name');
        expect(entry.tool).toHaveProperty('description');
        expect(entry.tool).toHaveProperty('inputSchema');
      });
    });
  });

  describe('getAllTools', () => {
    it('should return array of all tools', () => {
      const tools = getAllTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(7);

      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
    });

    it('should return tools in consistent order', () => {
      const tools1 = getAllTools();
      const tools2 = getAllTools();

      expect(tools1.map((t) => t.name)).toEqual(tools2.map((t) => t.name));
    });
  });

  describe('getToolHandler', () => {
    it('should return handler for valid tool name', () => {
      const handler = getToolHandler('start_mock_server');
      expect(handler).not.toBeNull();
      expect(typeof handler).toBe('function');
    });

    it('should return null for invalid tool name', () => {
      const handler = getToolHandler('invalid_tool');
      expect(handler).toBeNull();
    });

    it('should return null for empty string', () => {
      const handler = getToolHandler('');
      expect(handler).toBeNull();
    });

    it('should return different handlers for different tools', () => {
      const handler1 = getToolHandler('start_mock_server');
      const handler2 = getToolHandler('stop_mock_server');

      expect(handler1).not.toBeNull();
      expect(handler2).not.toBeNull();
      expect(handler1).not.toBe(handler2);
    });
  });

  describe('isValidToolName', () => {
    it('should return true for valid tool names', () => {
      const validNames = [
        'start_mock_server',
        'stop_mock_server',
        'add_endpoint',
        'remove_endpoint',
        'list_endpoints',
        'set_endpoint_error',
        'toggle_endpoint_error',
      ];

      validNames.forEach((name) => {
        expect(isValidToolName(name)).toBe(true);
      });
    });

    it('should return false for invalid tool names', () => {
      const invalidNames = [
        'invalid_tool',
        'start_server',
        'add_point',
        '',
        'undefined',
        'null',
      ];

      invalidNames.forEach((name) => {
        expect(isValidToolName(name)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidToolName('')).toBe(false);
      expect(isValidToolName(' start_mock_server')).toBe(false);
      expect(isValidToolName('start_mock_server ')).toBe(false);
      expect(isValidToolName('START_MOCK_SERVER')).toBe(false);
    });
  });

  describe('registry consistency', () => {
    it('should have handlers for all tools returned by getAllTools', () => {
      const tools = getAllTools();

      tools.forEach((tool) => {
        const handler = getToolHandler(tool.name);
        expect(handler).not.toBeNull();
        expect(isValidToolName(tool.name)).toBe(true);
      });
    });

    it('should have tools for all valid tool names', () => {
      Object.keys(TOOL_REGISTRY).forEach((toolName) => {
        expect(isValidToolName(toolName)).toBe(true);
        expect(getToolHandler(toolName)).not.toBeNull();
      });
    });

    it('should maintain immutability of registry', () => {
      const originalKeys = Object.keys(TOOL_REGISTRY);

      const registryCopy = { ...TOOL_REGISTRY };
      delete registryCopy['start_mock_server'];

      expect(Object.keys(TOOL_REGISTRY)).toEqual(originalKeys);
      expect(isValidToolName('start_mock_server')).toBe(true);
    });
  });
});
