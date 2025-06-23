import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import { createSuccessResponse, handleToolError } from '../utils/responses.js';
import { validatePort } from '../utils/validation.js';

export const STOP_MOCK_SERVER_TOOL: Tool = {
  name: 'stop_mock_server',
  description: 'Stop a running mock server on the specified port',
  inputSchema: {
    type: 'object',
    properties: {
      port: {
        ...PORT_SCHEMA,
        description: 'Port number of the server to stop',
      },
    },
    required: ['port'],
  },
};

export async function handleStopMockServer(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port } = args as { port: number };

    validatePort(port);

    const success = await serverManager.stopServer(port);

    if (success) {
      return createSuccessResponse(
        `Mock server on port ${port} stopped successfully`
      );
    } else {
      return createSuccessResponse(`No running server found on port ${port}`);
    }
  } catch (error) {
    return handleToolError(error, 'stop mock server');
  }
}
