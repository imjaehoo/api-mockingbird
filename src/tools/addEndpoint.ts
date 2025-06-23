import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

import { DEFAULT_HTTP_STATUS, HTTP_STATUS } from '../constants.js';
import { HTTP_METHOD_SCHEMA, PATH_SCHEMA, PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { MockEndpoint, ToolArgs } from '../types/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  handleToolError,
} from '../utils/responses.js';

export const ADD_ENDPOINT_TOOL: Tool = {
  name: 'add_endpoint',
  description: 'Add a new mock endpoint to an existing server',
  inputSchema: {
    type: 'object',
    properties: {
      port: PORT_SCHEMA,
      method: {
        ...HTTP_METHOD_SCHEMA,
        description: 'HTTP method for the endpoint',
      },
      path: {
        ...PATH_SCHEMA,
        description: 'URL path for the endpoint (e.g., /api/users)',
      },
      response: {
        type: 'object',
        description: 'Response configuration for the endpoint',
        properties: {
          status: {
            type: 'number',
            description: 'HTTP status code to return',
            minimum: HTTP_STATUS.MIN_STATUS,
            maximum: HTTP_STATUS.MAX_STATUS,
            default: DEFAULT_HTTP_STATUS,
          },
          body: {
            description: 'Response body (can be any JSON-serializable data)',
          },
          headers: {
            type: 'object',
            description: 'Custom response headers',
            additionalProperties: {
              type: 'string',
            },
          },
        },
        required: ['body'],
      },
    },
    required: ['port', 'method', 'path', 'response'],
  },
};

export async function handleAddEndpoint(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port, method, path, response } = args as {
      port: number;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      path: string;
      response: {
        status?: number;
        body: unknown;
        headers?: Record<string, string>;
      };
    };

    const { status = DEFAULT_HTTP_STATUS, body, headers } = response;

    const endpoint: MockEndpoint = {
      id: randomUUID(),
      method,
      path,
      response: {
        status,
        body,
        headers,
      },
    };

    const success = await serverManager.addEndpoint(port, endpoint);

    if (success) {
      return createSuccessResponse(
        `Endpoint added successfully:\n` +
          `${method} ${path} → ${status}\n` +
          `Server: http://localhost:${port}${path}\n` +
          `\n` +
          `Configuration auto-saved to .api-mockingbird.local/${port}.json\n` +
          `You can manually edit this file to modify endpoints or use set_endpoint_error tool for error responses`
      );
    } else {
      return createErrorResponse(
        `Failed to add endpoint: No running server found on port ${port}`
      );
    }
  } catch (error) {
    return handleToolError(error, 'add endpoint');
  }
}
