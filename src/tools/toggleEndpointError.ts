import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { HTTP_METHOD_SCHEMA, PATH_SCHEMA, PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  handleToolError,
} from '../utils/responses.js';

export const TOGGLE_ENDPOINT_ERROR_TOOL: Tool = {
  name: 'toggle_endpoint_error',
  description: 'Enable or disable error response for an endpoint',
  inputSchema: {
    type: 'object',
    properties: {
      port: PORT_SCHEMA,
      method: HTTP_METHOD_SCHEMA,
      path: PATH_SCHEMA,
      enabled: {
        type: 'boolean',
        description: 'Enable (true) or disable (false) error response',
      },
    },
    required: ['port', 'method', 'path', 'enabled'],
  },
};

export async function handleToggleEndpointError(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port, method, path, enabled } = args as {
      port: number;
      method: string;
      path: string;
      enabled: boolean;
    };

    const success = await serverManager.toggleEndpointError(
      port,
      method,
      path,
      enabled
    );

    if (success) {
      return createSuccessResponse(
        `Error response ${enabled ? 'ENABLED' : 'DISABLED'} for ${method} ${path}`
      );
    } else {
      return createErrorResponse(
        `Failed to toggle error: Server not found on port ${port}, endpoint doesn't exist, or no error response configured`
      );
    }
  } catch (error) {
    return handleToolError(error, 'toggle error');
  }
}
