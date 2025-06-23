#!/usr/bin/env node
import { MockingbirdServer } from './server.js';

async function main() {
  const server = new MockingbirdServer();
  await server.run();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
