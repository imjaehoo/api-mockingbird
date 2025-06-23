import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { MockServerManager } from './services/MockServerManager.js';
import {
  ADD_ENDPOINT_TOOL,
  LIST_ENDPOINTS_TOOL,
  REMOVE_ENDPOINT_TOOL,
  SET_ENDPOINT_ERROR_TOOL,
  START_MOCK_SERVER_TOOL,
  STOP_MOCK_SERVER_TOOL,
  TOGGLE_ENDPOINT_ERROR_TOOL,
  getAllTools,
  getToolHandler,
  isValidToolName,
} from './tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
const { version } = packageJson;

class MockingbirdServer {
  private server: Server;
  private serverManager: MockServerManager;
  private tools: Tool[];

  constructor() {
    this.serverManager = new MockServerManager();
    this.tools = getAllTools();

    this.server = new Server(
      {
        name: 'api-mockingbird',
        version,
      },
      {
        capabilities: {
          tools: {
            [START_MOCK_SERVER_TOOL.name]: START_MOCK_SERVER_TOOL,
            [STOP_MOCK_SERVER_TOOL.name]: STOP_MOCK_SERVER_TOOL,
            [ADD_ENDPOINT_TOOL.name]: ADD_ENDPOINT_TOOL,
            [REMOVE_ENDPOINT_TOOL.name]: REMOVE_ENDPOINT_TOOL,
            [LIST_ENDPOINTS_TOOL.name]: LIST_ENDPOINTS_TOOL,
            [SET_ENDPOINT_ERROR_TOOL.name]: SET_ENDPOINT_ERROR_TOOL,
            [TOGGLE_ENDPOINT_ERROR_TOOL.name]: TOGGLE_ENDPOINT_ERROR_TOOL,
          },
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!isValidToolName(name)) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const handler = getToolHandler(name);
      if (!handler) {
        throw new Error(`No handler found for tool: ${name}`);
      }

      return await handler(this.serverManager, args ?? {});
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('api-mockingbird MCP server running on stdio');
  }
}

export { MockingbirdServer };
