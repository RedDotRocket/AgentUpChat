import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it('renders the input field and send button', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted with text', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.click(submitButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('clears input after sending message', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.click(submitButton);

    expect(input.value).toBe('');
  });

  it('does not send empty messages', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} disabled />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByRole('button', { name: /send message/i });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('sends message on Enter key press', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('does not send message on Shift+Enter', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });
});