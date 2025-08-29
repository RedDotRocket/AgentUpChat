import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/jsonrpc';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const content = message.parts.map(part => part.text).join('');
  const completionMetadata = !isUser ? message.metadata : null;
  
  // Split content into iterations if it contains the double newline separators
  const contentParts = !isUser && content.includes('\n\n') 
    ? content.split('\n\n').filter(part => part.trim())
    : [content];
  
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
                <>
                  <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                    {contentParts.length > 1 ? (
                      // Multiple iterations - render with separation
                      contentParts.map((part, index) => (
                        <div key={index} className="mb-6 last:mb-4">
                          {/* Iteration header */}
                          <div className="flex items-center gap-2 mb-3 -mx-1">
                            <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                            <span className="text-xs text-gray-500 font-medium">Step {index + 1}</span>
                          </div>
                          
                          {/* Iteration content with subtle background */}
                          <div className="bg-gradient-to-r from-gray-50/50 to-transparent rounded-lg p-4 border-l-2 border-gray-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Single response - render normally
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Completion Metadata Display - Only show if there's actual data */}
                  {completionMetadata && (
                    completionMetadata.confidence !== null ||
                    completionMetadata.executionTime !== null ||
                    completionMetadata.iterationsCompleted !== null ||
                    completionMetadata.finalStatus !== null ||
                    completionMetadata.summary !== null ||
                    (completionMetadata.tasksCompleted && completionMetadata.tasksCompleted.length > 0)
                  ) && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {/* Summary - if available */}
                      {completionMetadata.summary && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-md text-xs text-gray-700 italic">
                          &ldquo;{completionMetadata.summary}&rdquo;
                        </div>
                      )}
                      
                      {/* Key metrics - confidence and iterations prominently displayed */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {completionMetadata.confidence !== null && (
                          <div className="flex items-center gap-1 font-medium text-blue-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{Math.round(completionMetadata.confidence * 100)}% confidence</span>
                          </div>
                        )}
                        {completionMetadata.iterationsCompleted && completionMetadata.iterationsCompleted > 0 && (
                          <div className="flex items-center gap-1 font-medium text-purple-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{completionMetadata.iterationsCompleted} iterations</span>
                          </div>
                        )}
                        {completionMetadata.executionTime && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{completionMetadata.executionTime}</span>
                          </div>
                        )}
                        {completionMetadata.finalStatus && (
                          <div className={`flex items-center gap-1 ${
                            completionMetadata.finalStatus === 'fully_achieved' ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              completionMetadata.finalStatus === 'fully_achieved' ? 'bg-green-500' : 'bg-amber-500'
                            }`}></div>
                            <span className="capitalize">{completionMetadata.finalStatus.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tasks Completed */}
                      {completionMetadata.tasksCompleted && completionMetadata.tasksCompleted.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                            {completionMetadata.tasksCompleted.length} tasks completed
                          </summary>
                          <ul className="mt-1 text-xs text-gray-600 space-y-1">
                            {completionMetadata.tasksCompleted.map((task: string, index: number) => (
                              <li key={index} className="flex items-start gap-1">
                                <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </>
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