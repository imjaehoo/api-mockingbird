import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import { createSuccessResponse, handleToolError } from '../utils/responses.js';

export const LIST_ENDPOINTS_TOOL: Tool = {
  name: 'list_endpoints',
  description:
    'List all endpoints across mock servers (all servers or specific port)',
  inputSchema: {
    type: 'object',
    properties: {
      port: {
        ...PORT_SCHEMA,
        description:
          'Optional: specific port to check. If omitted, shows all servers',
      },
    },
  },
};

export async function handleListEndpoints(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port } = args as { port?: number };

    if (port) {
      const server = serverManager.getServerStatus(port);
      if (!server) {
        return createSuccessResponse(`No server found on port ${port}`);
      }

      const endpointsList = server.endpoints
        .map((ep) => {
          const errorInfo = ep.errorResponse
            ? ` [Error: ${ep.errorResponse.enabled ? 'ON' : 'OFF'}]`
            : '';
          const delayInfo = ep.delay ? ` [Delay: ${ep.delay}ms]` : '';
          return `  ${ep.method} ${ep.path} → ${ep.response.status}${errorInfo}${delayInfo}`;
        })
        .join('\n');

      return createSuccessResponse(
        `Server Status - Port ${port}\n` +
          `Status: ${server.isRunning ? 'Running' : 'Stopped'}\n` +
          `URL: http://localhost:${port}\n` +
          `Endpoints (${server.endpoints.length}):\n` +
          (endpointsList || '  No endpoints configured')
      );
    } else {
      const allServers = serverManager.getAllServers();

      if (allServers.length === 0) {
        return createSuccessResponse('No mock servers running');
      }

      const serverList = allServers
        .map((server) => {
          const status = server.isRunning ? 'Running' : 'Stopped';
          const endpointsList =
            server.endpoints.length > 0
              ? server.endpoints
                  .map((ep) => {
                    const errorInfo = ep.errorResponse
                      ? ` [Error: ${ep.errorResponse.enabled ? 'ON' : 'OFF'}]`
                      : '';
                    const delayInfo = ep.delay ? ` [Delay: ${ep.delay}ms]` : '';
                    return `    ${ep.method} ${ep.path} → ${ep.response.status}${errorInfo}${delayInfo}`;
                  })
                  .join('\n')
              : '    No endpoints configured';

          return `Port ${server.port}: ${status}\n  URL: http://localhost:${server.port}\n  Endpoints (${server.endpoints.length}):\n${endpointsList}`;
        })
        .join('\n\n');

      return createSuccessResponse(`Mock Servers:\n\n${serverList}`);
    }
  } catch (error) {
    return handleToolError(error, 'list endpoints');
  }
}
