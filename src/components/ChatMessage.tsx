import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/jsonrpc';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const content = message.parts.map(part => part.text).join('');
  
  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 mt-1">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
            </div>
          )}
          <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-2'}`}>
            <div className={`rounded-lg px-4 py-3 ${
              isUser 
                ? 'bg-black text-white ml-auto'
                : 'bg-white border border-gray-200'
            }`}>
              {isUser ? (
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 mt-1 order-2">
              <div className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium">
                U
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}