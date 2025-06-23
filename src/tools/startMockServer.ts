import { Tool } from '@modelcontextprotocol/sdk/types.js';

import { PORT_SCHEMA } from '../schemas.js';
import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import { createSuccessResponse, handleToolError } from '../utils/responses.js';
import { validatePort } from '../utils/validation.js';

export const START_MOCK_SERVER_TOOL: Tool = {
  name: 'start_mock_server',
  description: 'Start a new HTTP mock server on the specified port',
  inputSchema: {
    type: 'object',
    properties: {
      port: PORT_SCHEMA,
    },
    required: ['port'],
  },
};

export async function handleStartMockServer(
  serverManager: MockServerManager,
  args: ToolArgs
) {
  try {
    const { port } = args as {
      port: number;
    };

    validatePort(port);

    await serverManager.startServer({
      port,
    });

    return createSuccessResponse(
      `Mock server started successfully on port ${port}\n` +
        `CORS: enabled\n` +
        `Server URL: http://localhost:${port}`
    );
  } catch (error) {
    return handleToolError(error, 'start mock server');
  }
}
