# 🧪 Terminal Integration Test Guide

## Overview
This guide helps you test the complete terminal integration for the Agentuity interactive tutorial system.

## 📋 Components Implemented

### ✅ Backend Components
- **WebSocket Server** (`lib/terminal/websocket-server.ts`)
  - Handles terminal sessions with node-pty
  - Manages WebSocket connections
  - Provides real terminal environment

- **API Routes** (`app/api/terminal/route.ts`)
  - REST API for terminal management
  - Session status and control endpoints

### ✅ Frontend Components
- **Terminal Component** (`components/terminal/TerminalComponent.tsx`)
  - xterm.js integration
  - Real-time WebSocket communication
  - Terminal UI with connection status

- **Chat Integration** (`app/chat/components/ChatInterface.tsx`)
  - Terminal toggle button
  - Split-screen layout (chat + terminal)
  - Tutorial-triggered terminal opening

### ✅ Tutorial Integration
- **Enhanced Tutorial Steps**
  - Terminal-based tutorial flow
  - Auto-opening terminal for relevant steps
  - Interactive command guidance

## 🚀 How to Test

### 1. Start Both Servers
```bash
# Option 1: Start both together
npm run dev:full

# Option 2: Start separately
npm run terminal-server  # Terminal 1
npm run dev              # Terminal 2
```

### 2. Test the Flow
1. **Visit**: `http://localhost:3201/chat`
2. **Click**: "Create First Agent" button
3. **Verify**: Terminal opens automatically
4. **Test**: Type commands in terminal
5. **Verify**: Terminal responds with real bash shell

### 3. Test Tutorial Integration
1. **Chat**: Type "create agent" in chat
2. **Verify**: Tutorial response appears
3. **Verify**: Terminal opens automatically
4. **Test**: Follow tutorial commands

## 🎯 Expected Behavior

### Terminal Component
- ✅ Terminal opens with welcome message
- ✅ Shows connection status (Connected/Disconnected)
- ✅ Responds to keyboard input
- ✅ Displays colorized output
- ✅ Resizes with window

### Chat Integration
- ✅ Terminal toggle button works
- ✅ Split-screen layout adjusts properly
- ✅ Tutorial messages trigger terminal opening
- ✅ Terminal stays open during tutorial

### WebSocket Connection
- ✅ Connects to ws://localhost:8080/terminal
- ✅ Maintains persistent connection
- ✅ Handles reconnection on failure
- ✅ Properly cleans up on close

## 🔧 Commands to Test

### Basic Commands
```bash
pwd          # Show current directory
ls -la       # List files
echo "hello" # Echo output
whoami       # Show current user
```

### Tutorial Commands (Mock)
```bash
# These would be real Agentuity commands in production
agentuity --help
agentuity agent create my-first-agent
agentuity agent configure
agentuity deploy
```

## 🐛 Troubleshooting

### Terminal Won't Connect
- Check if WebSocket server is running on port 8080
- Verify no other service is using port 8080
- Check browser console for WebSocket errors

### Terminal Doesn't Open
- Verify chat tutorial keywords are triggering correctly
- Check if terminal toggle button is visible
- Ensure React state updates are working

### Commands Don't Work
- Verify node-pty is installed correctly
- Check if bash is available in the system
- Ensure WebSocket messages are being sent

## 🎉 Success Criteria

### MVP Requirements Met
- ✅ Chat interface with terminal integration
- ✅ Interactive terminal with real bash shell
- ✅ Tutorial flow that guides users through Agentuity commands
- ✅ WebSocket-based real-time communication
- ✅ Clean UI with proper layout management

### Ready for Enhancement
- 🔄 Docker container integration (next phase)
- 🔄 Real Agentuity CLI integration (next phase)
- 🔄 Advanced tutorial content (next phase)
- 🔄 Session persistence (next phase)

## 📊 Current Status

**Phase 1: MVP Terminal Integration** ✅ **COMPLETE**

This implementation provides a solid foundation for the interactive tutorial system with:
- Real terminal environment
- Chat-terminal integration
- Basic tutorial flow
- WebSocket communication
- Modern UI components

The system is ready for users to test and provide feedback! 