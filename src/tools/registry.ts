import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

import { MockServerManager } from '../services/MockServerManager.js';
import { ToolArgs } from '../types/index.js';
import { ADD_ENDPOINT_TOOL, handleAddEndpoint } from './addEndpoint.js';
import { LIST_ENDPOINTS_TOOL, handleListEndpoints } from './listEndpoints.js';
import {
  REMOVE_ENDPOINT_TOOL,
  handleRemoveEndpoint,
} from './removeEndpoint.js';
import {
  SET_ENDPOINT_ERROR_TOOL,
  handleSetEndpointError,
} from './setEndpointError.js';
import {
  START_MOCK_SERVER_TOOL,
  handleStartMockServer,
} from './startMockServer.js';
import {
  STOP_MOCK_SERVER_TOOL,
  handleStopMockServer,
} from './stopMockServer.js';
import {
  TOGGLE_ENDPOINT_ERROR_TOOL,
  handleToggleEndpointError,
} from './toggleEndpointError.js';

type ToolHandler = (
  serverManager: MockServerManager,
  args: ToolArgs
) => Promise<CallToolResult>;

interface ToolRegistryEntry {
  tool: Tool;
  handler: ToolHandler;
}

export const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
  [START_MOCK_SERVER_TOOL.name]: {
    tool: START_MOCK_SERVER_TOOL,
    handler: handleStartMockServer,
  },
  [STOP_MOCK_SERVER_TOOL.name]: {
    tool: STOP_MOCK_SERVER_TOOL,
    handler: handleStopMockServer,
  },
  [ADD_ENDPOINT_TOOL.name]: {
    tool: ADD_ENDPOINT_TOOL,
    handler: handleAddEndpoint,
  },
  [REMOVE_ENDPOINT_TOOL.name]: {
    tool: REMOVE_ENDPOINT_TOOL,
    handler: handleRemoveEndpoint,
  },
  [LIST_ENDPOINTS_TOOL.name]: {
    tool: LIST_ENDPOINTS_TOOL,
    handler: handleListEndpoints,
  },
  [SET_ENDPOINT_ERROR_TOOL.name]: {
    tool: SET_ENDPOINT_ERROR_TOOL,
    handler: handleSetEndpointError,
  },
  [TOGGLE_ENDPOINT_ERROR_TOOL.name]: {
    tool: TOGGLE_ENDPOINT_ERROR_TOOL,
    handler: handleToggleEndpointError,
  },
} as const;

export type ToolName = keyof typeof TOOL_REGISTRY;

export function getAllTools(): Tool[] {
  return Object.values(TOOL_REGISTRY).map((entry) => entry.tool);
}

export function getToolHandler(name: string): ToolHandler | null {
  const entry = TOOL_REGISTRY[name];
  return entry?.handler ?? null;
}

export function isValidToolName(name: string): name is ToolName {
  return name in TOOL_REGISTRY;
}
