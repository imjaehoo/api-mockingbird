import { describe, expect, it } from 'vitest';

import {
  createErrorResponse,
  createSuccessResponse,
  handleToolError,
} from '../src/utils/responses.js';
import { validatePort } from '../src/utils/validation.js';

describe('Response Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create success response with correct format', () => {
      const message = 'Operation completed successfully';
      const response = createSuccessResponse(message);

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      });
      expect(response.isError).toBeUndefined();
    });

    it('should handle empty message', () => {
      const response = createSuccessResponse('');
      expect(response.content[0].text).toBe('');
    });

    it('should handle multi-line messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const response = createSuccessResponse(message);
      expect(response.content[0].text).toBe(message);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct format', () => {
      const message = 'Something went wrong';
      const response = createErrorResponse(message);

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
        isError: true,
      });
    });

    it('should handle empty error message', () => {
      const response = createErrorResponse('');
      expect(response.content[0].text).toBe('');
      expect(response.isError).toBe(true);
    });
  });

  describe('handleToolError', () => {
    it('should handle Error instance correctly', () => {
      const error = new Error('Database connection failed');
      const operation = 'save data';
      const response = handleToolError(error, operation);

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toBe(
        'Failed to save data: Database connection failed'
      );
    });

    it('should handle string error', () => {
      const error = 'Network timeout';
      const operation = 'fetch data';
      const response = handleToolError(error, operation);

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toBe(
        'Failed to fetch data: Unknown error'
      );
    });

    it('should handle unknown error types', () => {
      const error = { code: 500, message: 'Internal error' };
      const operation = 'process request';
      const response = handleToolError(error, operation);

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toBe(
        'Failed to process request: Unknown error'
      );
    });

    it('should handle null/undefined errors', () => {
      const response1 = handleToolError(null, 'test operation');
      const response2 = handleToolError(undefined, 'test operation');

      expect(response1.content[0].text).toBe(
        'Failed to test operation: Unknown error'
      );
      expect(response2.content[0].text).toBe(
        'Failed to test operation: Unknown error'
      );
    });
  });
});

describe('Validation Utilities', () => {
  describe('validatePort', () => {
    it('should accept valid port numbers', () => {
      const validPorts = [1024, 3000, 8080, 8443, 65535];

      validPorts.forEach((port) => {
        expect(() => validatePort(port)).not.toThrow();
      });
    });

    it('should reject ports below minimum', () => {
      const invalidPorts = [1, 500, 1023];

      invalidPorts.forEach((port) => {
        expect(() => validatePort(port)).toThrow(
          'Port must be between 1024 and 65535'
        );
      });

      expect(() => validatePort(0)).toThrow(
        'Port number is required and must be a valid number'
      );
    });

    it('should reject ports above maximum', () => {
      const invalidPorts = [65536, 70000, 100000];

      invalidPorts.forEach((port) => {
        expect(() => validatePort(port)).toThrow(
          'Port must be between 1024 and 65535'
        );
      });
    });

    it('should handle edge cases', () => {
      expect(() => validatePort(1024)).not.toThrow();
      expect(() => validatePort(65535)).not.toThrow();

      expect(() => validatePort(1023)).toThrow();
      expect(() => validatePort(65536)).toThrow();
    });

    it('should handle non-integer inputs', () => {
      expect(() => validatePort(-1)).toThrow(
        'Port must be between 1024 and 65535'
      );
    });

    it('should handle NaN and Infinity', () => {
      expect(() => validatePort(NaN)).toThrow(
        'Port number is required and must be a valid number'
      );
      expect(() => validatePort(Infinity)).toThrow(
        'Port must be between 1024 and 65535'
      );
      expect(() => validatePort(-Infinity)).toThrow(
        'Port must be between 1024 and 65535'
      );
    });
  });
});
