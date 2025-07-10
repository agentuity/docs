#!/usr/bin/env node

/**
 * Terminal WebSocket Server Startup Script
 * 
 * This script starts the WebSocket server for terminal sessions
 * that enables interactive terminal functionality in the chat interface.
 */

const path = require('path');
const { spawn } = require('child_process');

// Path to the terminal server module
const serverPath = path.join(__dirname, '..', 'lib', 'terminal', 'websocket-server.ts');

console.log('🚀 Starting Agentuity Terminal WebSocket Server...');
console.log('📂 Server path:', serverPath);

// Start the server using ts-node
const serverProcess = spawn('npx', ['ts-node', serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

// Handle server process events
serverProcess.on('close', (code) => {
  console.log(`\n❌ Terminal server process exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start terminal server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down terminal server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down terminal server...');
  serverProcess.kill('SIGTERM');
});

console.log('✅ Terminal server startup script is running');
console.log('📡 Server will be available at ws://localhost:8080/terminal');
console.log('💡 Press Ctrl+C to stop the server'); 