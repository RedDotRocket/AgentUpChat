import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/jsonrpc';
import Image from 'next/image';

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
            <div className="flex-shrink-0 w-10 h-10 mt-1">
              <Image src="/mascot_one.png" alt="Assistant" width={40} height={40} className="rounded-full shadow-sm" />
            </div>
          )}
          <div className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}>
            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto'
                : 'bg-white border border-gray-200'
            }`}>
              {isUser ? (
                <div className="text-white text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                  {content}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-10 h-10 mt-1 order-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm">
                U
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}