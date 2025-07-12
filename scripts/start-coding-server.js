#!/usr/bin/env node

const { CodingWebSocketServer } = require('../lib/coding/websocket-server.js');

// Start the coding server
console.log('Starting Coding WebSocket Server...');
console.log('This version runs Python directly for execution');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down coding server...');
  
  // Close all coding sessions
  const { codingServer } = require('../lib/coding/websocket-server.js');
  codingServer.closeAllSessions();
  
  console.log('Coding server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down coding server...');
  
  // Close all coding sessions  
  const { codingServer } = require('../lib/coding/websocket-server.js');
  codingServer.closeAllSessions();
  
  console.log('Coding server shutdown complete');
  process.exit(0);
});

console.log('Coding WebSocket Server is running');
console.log('Press Ctrl+C to stop'); 