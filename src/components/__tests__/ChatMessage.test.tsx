import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';
import { Message } from '@/types/jsonrpc';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

describe('ChatMessage', () => {
  const mockUserMessage: Message = {
    message_id: '1',
    role: 'user',
    parts: [{ text: 'Hello, how are you?' }],
    timestamp: new Date().toISOString(),
  };

  const mockAssistantMessage: Message = {
    message_id: '2',
    role: 'assistant',
    parts: [{ text: 'I am doing well, thank you!' }],
    timestamp: new Date().toISOString(),
  };

  it('renders user message correctly', () => {
    render(<ChatMessage message={mockUserMessage} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument(); // User avatar
  });

  it('renders assistant message correctly', () => {
    render(<ChatMessage message={mockAssistantMessage} />);
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    // Assistant now uses SVG icon instead of image
    const assistantIcon = document.querySelector('.bg-gray-900.rounded-full svg');
    expect(assistantIcon).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    const { container } = render(<ChatMessage message={mockUserMessage} />);
    
    // Check for black background on user message bubble
    const messageContainer = container.querySelector('.bg-black.text-white');
    expect(messageContainer).toBeInTheDocument();
  });

  it('applies correct styling for assistant messages', () => {
    const { container } = render(<ChatMessage message={mockAssistantMessage} />);
    
    // Check for white background on assistant message bubble
    const messageContainer = container.querySelector('.bg-white.border.border-gray-200');
    expect(messageContainer).toBeInTheDocument();
  });

  it('handles multiple text parts in message', () => {
    const multiPartMessage: Message = {
      message_id: '3',
      role: 'user',
      parts: [
        { text: 'Hello ' },
        { text: 'world' },
      ],
      timestamp: new Date().toISOString(),
    };

    render(<ChatMessage message={multiPartMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('uses markdown rendering for assistant messages', () => {
    render(<ChatMessage message={mockAssistantMessage} />);
    
    // Should render markdown content for assistant
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('I am doing well, thank you!');
  });

  it('uses plain text rendering for user messages', () => {
    render(<ChatMessage message={mockUserMessage} />);
    
    // Should not render markdown content for user
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });
});