import { Tool } from '@modelcontextprotocol/sdk/types.js';

import {
  HTTP_METHOD_SCHEMA,
  PATH_SCHEMA,
  PORT_SCHEMA,
  STATUS_CODE_SCHEMA,
} from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  handleToolError,
} from '../utils/responses.js';

export const SET_ENDPOINT_ERROR_TOOL: Tool = {
  name: 'set_endpoint_error',
  description: 'Set an error response for an endpoint',
  inputSchema: {
    type: 'object',
    properties: {
      port: PORT_SCHEMA,
      method: HTTP_METHOD_SCHEMA,
      path: PATH_SCHEMA,
      status: STATUS_CODE_SCHEMA,
      message: {
        type: 'string',
        description: 'Error message to return',
      },
    },
    required: ['port', 'method', 'path', 'status', 'message'],
  },
};

export async function handleSetEndpointError(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port, method, path, status, message } = args as {
      port: number;
      method: string;
      path: string;
      status: number;
      message: string;
    };

    const success = await serverManager.setEndpointError(
      port,
      method,
      path,
      status,
      message
    );

    if (success) {
      return createSuccessResponse(
        `Error response set for ${method} ${path}:\n` +
          `Status: ${status}\n` +
          `Message: ${message}\n` +
          `\nError is now ENABLED. Use toggle_endpoint_error to disable.`
      );
    } else {
      return createErrorResponse(
        `Failed to set error: Server not found on port ${port} or endpoint doesn't exist`
      );
    }
  } catch (error) {
    return handleToolError(error, 'set error');
  }
}
