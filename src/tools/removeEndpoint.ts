import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { HTTP_METHOD_SCHEMA, PATH_SCHEMA, PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  handleToolError,
} from '../utils/responses.js';

export const REMOVE_ENDPOINT_TOOL: Tool = {
  name: 'remove_endpoint',
  description: 'Remove a mock endpoint from an existing server',
  inputSchema: {
    type: 'object',
    properties: {
      port: PORT_SCHEMA,
      method: {
        ...HTTP_METHOD_SCHEMA,
        description: 'HTTP method of the endpoint to remove',
      },
      path: {
        ...PATH_SCHEMA,
        description: 'URL path of the endpoint to remove (e.g., /api/users)',
      },
    },
    required: ['port', 'method', 'path'],
  },
};

export async function handleRemoveEndpoint(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port, method, path } = args as {
      port: number;
      method: string;
      path: string;
    };

    const success = await serverManager.removeEndpoint(port, method, path);

    if (success) {
      return createSuccessResponse(
        `Endpoint removed successfully:\n` +
          `${method} ${path}\n` +
          `Server: http://localhost:${port}`
      );
    } else {
      return createErrorResponse(
        `Failed to remove endpoint: Server not found on port ${port} or endpoint doesn't exist`
      );
    }
  } catch (error) {
    return handleToolError(error, 'remove endpoint');
  }
}
