# API Mockingbird MCP Server

A Model Context Protocol (MCP) server that creates HTTP mock APIs for client development. API Mockingbird allows you to quickly spin up mock servers with realistic responses and error scenarios while your server teammates work on the real APIs.

## Features

- 🚀 **Quick HTTP Server Setup** - Start mock servers on any port (1024-65535)
- 🎯 **Dynamic Endpoint Management** - Add/remove endpoints without server restart
- 🎭 **Error Simulation** - Test error handling with configurable error scenarios
- 🔧 **CORS Support** - Built-in CORS handling for development
- 📊 **Server Status** - Monitor running servers and their endpoints
- 💾 **Persistence** - Endpoints auto-save and reload across server restarts

## Installation

### Claude Code

```bash
claude mcp add api-mockingbird npx api-mockingbird@latest
```

### VS Code

```bash
code --add-mcp '{"name":"api-mockingbird","command":"npx","args":["api-mockingbird@latest"]}'
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=api-mockingbird&config=eyJjb21tYW5kIjoibnB4IGFwaS1tb2NraW5nYmlyZEBsYXRlc3QifQ%3D%3D)

## Available Tools

### `start_mock_server`

Start a new HTTP mock server.

Starts server and auto-loads any saved endpoints for that port.

### `add_endpoint`

Add or update a mock endpoint. If an endpoint with the same method and path exists, it will be replaced. Auto-saves configuration.

### `remove_endpoint`

Remove a specific endpoint from a server. Auto-saves configuration.

### `set_endpoint_error`

Configure an error response for an endpoint.

### `toggle_endpoint_error`

Enable or disable the error response for an endpoint.

### `list_endpoints`

List all endpoints for a specific server or all running servers. Shows endpoint details, status, and error configurations.

### `stop_mock_server`

Stop a running mock server.

## Example Workflow

```text
1. Start a mock server:
   "Start a api-mockingbird server on port 4000"

2. Add user endpoints:
   "Add a GET /api/users api-mockingbird endpoint that returns a list of 5 users"
   "Add a POST /api/users api-mockingbird endpoint that creates a user"

3. Update endpoints:
   "Change api-mockingbird GET /api/users to return 10 users instead of 5"
   (same add_endpoint command replaces existing)

4. Test your frontend:
   Your React app can now call http://localhost:4000/api/users

5. Manage endpoints:
   "Remove the api-mockingbird POST /api/users endpoint"
   "Set a 500 server error for the GET /api/users api-mockingbird endpoint"
   "Enable error response for api-mockingbird GET /api/users"
   "Disable error response for api-mockingbird GET /api/users"
```

## Endpoint Management

**Create:** Use `add_endpoint` to create new endpoints  
**Update:** Use `add_endpoint` with same method+path to replace existing endpoint  
**Delete:** Use `remove_endpoint` to delete specific endpoints  
**View:** Use `list_endpoints` to see all endpoints

All changes auto-save and persist across server restarts.

## Configuration Persistence

Endpoints are automatically saved to `.api-mockingbird.local/` directory:

- Each server's endpoints are saved as `{port}.json`
- Configurations auto-load when restarting servers
- Includes endpoint responses, headers, and error settings

## Development

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:watch
npm run inspect
```

## Architecture

```text
src/
├── constants.ts     # Application constants and HTTP status codes
├── schemas.ts       # Shared JSON schemas for validation
├── types/           # TypeScript type definitions
├── services/        # Core business logic
│   └── MockServerManager.ts
├── tools/           # MCP tool implementations and registry
│   ├── registry.ts  # Type-safe tool registration system
│   ├── startMockServer.ts
│   ├── stopMockServer.ts
│   ├── addEndpoint.ts
│   ├── removeEndpoint.ts
│   ├── listEndpoints.ts
│   ├── setEndpointError.ts
│   ├── toggleEndpointError.ts
│   └── index.ts     # Tool exports and barrel imports
├── utils/           # Shared utilities
│   ├── responses.ts # Response creation helpers
│   └── validation.ts # Input validation functions
├── server.ts        # MCP server setup with type-safe tool handling
└── index.ts         # Entry point
```

## Testing

Comprehensive test suite with 74+ tests covering:

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode for development
```

**Test Coverage:**

- **MockServerManager**: Server lifecycle, endpoint CRUD, persistence
- **Tool Handlers**: All 7 tool implementations with success/error scenarios
- **Tool Registry**: Type-safe tool registration and handler mapping
- **Utilities**: Response creation, validation, error handling
- **Persistence**: Configuration save/load across server restarts

## License

MIT
