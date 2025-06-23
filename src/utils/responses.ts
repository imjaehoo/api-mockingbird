import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function createSuccessResponse(message: string): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}

export function createErrorResponse(message: string): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

export function handleToolError(
  error: unknown,
  operation: string
): CallToolResult {
  const message = `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  return createErrorResponse(message);
}
