# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of API Mockingbird MCP Server
- HTTP mock server creation and management
- Dynamic endpoint management (add/remove/update)
- Error simulation capabilities
- CORS support for development
- Configuration persistence across server restarts
- Comprehensive test suite with 74+ tests
- Type-safe tool registry system

### Features

- Start/stop mock servers on any port (1024-65535)
- Add, remove, and list endpoints dynamically
- Configure error responses and toggle them
- Auto-save configurations to `.api-mockingbird.local/` directory
- Support for custom headers and status codes
- Real-time endpoint management without server restart
