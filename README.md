# StreamChat

A modern, real-time chat interface for AgentUp AI agents with streaming responses and a beautiful UI.

## Features

- **Real-time Streaming**: Live streaming of AI responses with smooth text animation
- **Modern UI**: Clean, modern interface with chat bubbles and glassmorphism effects
- **Agent Monitoring**: Real-time server status and agent information display
- **Tools Discovery**: View available agent tools and capabilities
- **Session Management**: Track and display current chat sessions
- **Responsive Design**: Works great on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- AgentUp server running on `localhost:8000` (or configure in settings)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/streamchat.git
cd streamchat
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

The app will automatically connect to your AgentUp server at `localhost:8000`. You can change this in the settings panel (gear icon in the top-right).

## Architecture

### Key Components

- **ChatMessage**: Renders individual chat messages with proper styling
- **StreamingMessage**: Handles live streaming of AI responses
- **ChatInput**: Modern input component with send functionality
- **ToolsDisplay**: Shows available agent tools and capabilities
- **Settings**: Configuration panel for server connection

### Hooks

- **useStreamingChat**: Manages WebSocket connection and message state
- **useServerStatus**: Monitors server health and fetches agent information

### Server Integration

StreamChat integrates with AgentUp servers via:
- **WebSocket**: Real-time message streaming (`/chat/stream`)
- **Agent Card**: Tool discovery (`/.well-known/agent-card.json`)
- **Health Check**: Server status monitoring

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
npm start
```

## API Integration

StreamChat expects your AgentUp server to provide:

1. **WebSocket Endpoint**: `/chat/stream`
   - Accepts JSON-RPC messages
   - Streams responses in real-time

2. **Agent Card**: `/.well-known/agent-card.json`
   - Provides agent metadata and available tools
   - Used for server status and tools display

3. **Message Format**:
```typescript
interface Message {
  message_id: string;
  role: 'user' | 'assistant';
  parts: Array<{ text: string }>;
  timestamp: string;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Write tests for new components and features
- Follow the existing code style and conventions
- Use TypeScript for type safety
- Update documentation for significant changes

## License

This project is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details.

