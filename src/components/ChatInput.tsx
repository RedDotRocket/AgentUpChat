import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled}
          className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:opacity-50 text-sm placeholder-gray-500 bg-white transition-all duration-150"
          rows={1}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="w-7 h-7 bg-black text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
            title="Send message"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}