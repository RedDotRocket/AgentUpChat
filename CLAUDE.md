# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Architecture Overview

StreamChat is a Next.js 15 application that provides a real-time chat interface for AgentUp AI agents with streaming responses. The application follows a component-based architecture with TypeScript and uses Zod for runtime type validation.

### Core Architecture Patterns

**Streaming Protocol**: The app implements JSON-RPC 2.0 over WebSocket connections for real-time streaming. It handles three main response types:
- `task`: Initial task creation with context ID
- `artifact-update`: Streaming content chunks (supports append mode)
- `status-update`: Task status changes (working/completed)

**State Management**: Uses React hooks pattern with custom hooks for complex state:
- `useStreamingChat`: Manages WebSocket connections, message history, and streaming state
- `useServerStatus`: Monitors AgentUp server health and fetches agent capabilities

**Type Safety**: Heavily relies on Zod schemas for runtime validation of JSON-RPC messages and streaming responses. All types are derived from Zod schemas using `z.infer<>`.

### Key Components

**Message Components**:
- `ChatMessage`: Renders completed messages with role-based styling and markdown support
- `StreamingMessage`: Handles live streaming with `SmoothStreamingText` animation
- `SmoothStreamingText`: Provides typewriter effect for streaming content

**Integration Components**:
- `Settings`: Server connection configuration (host, port, API key)
- `ToolsDisplay`: Shows agent capabilities from `/.well-known/agent-card.json`

### Server Integration

The application expects AgentUp servers to provide:
1. **WebSocket endpoint**: `/` (HTTP POST with JSON-RPC 2.0)
2. **Health check**: `/health` 
3. **Agent metadata**: `/.well-known/agent-card.json`

**Message Flow**:
1. User message → JSON-RPC request to AgentUp server
2. Server responds with streaming SSE (Server-Sent Events) 
3. Client accumulates chunks and renders with smooth animation
4. Final status update saves complete message to history

### Configuration

**Path Aliases**: Uses `@/*` for `./src/*` imports

**Testing**: Jest with jsdom environment, includes setup for Next.js and module name mapping

**Styling**: TailwindCSS with typography plugin for markdown rendering

**Key Dependencies**:
- `zod`: Runtime type validation for JSON-RPC protocol
- `react-markdown` + `remark-gfm`: Markdown rendering with GitHub flavored markdown
- `uuid`: Generates message and context IDs

### Development Notes

**Local Development**: Defaults to connecting to AgentUp server at `localhost:8000`

**Authentication**: Supports optional API key authentication via `X-API-Key` header

**Error Handling**: Implements specific error handling for authentication failures (401) with user-friendly messages

**Context Management**: Maintains conversation context across messages using `contextId` for session continuity