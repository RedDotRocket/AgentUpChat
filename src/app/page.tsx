'use client';

import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useServerStatus } from '@/hooks/useServerStatus';
import ChatMessage from '@/components/ChatMessage';
import StreamingMessage from '@/components/StreamingMessage';
import ChatInput from '@/components/ChatInput';
import Settings from '@/components/Settings';
import ToolsDisplay from '@/components/ToolsDisplay';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const { messages, streamingState, settings, sendMessage, updateSettings } = useStreamingChat();
  const serverStatus = useServerStatus(settings.host, Number(settings.port));
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingState.currentResponse]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-100 px-6 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Image src="/logo.png" alt="StreamChat" width={140} height={46} className="rounded-lg" />
            {streamingState.contextId && (
              <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <span className="text-xs text-purple-600 font-medium uppercase tracking-wide block">Session</span>
                  <p className="text-sm text-purple-800 font-mono font-semibold">
                    {streamingState.contextId.slice(0, 12)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 ${
              serverStatus.isOnline && serverStatus.isHealthy
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                serverStatus.isOnline && serverStatus.isHealthy
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-red-500'
              }`}></div>
              <div className="text-right">
                <span className={`text-xs font-medium uppercase tracking-wide block ${
                  serverStatus.isOnline && serverStatus.isHealthy
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}>
                  {serverStatus.isOnline && serverStatus.isHealthy ? 'Connected' : 'Offline'}
                </span>
                <span className={`text-sm font-semibold ${
                  serverStatus.isOnline && serverStatus.isHealthy
                    ? 'text-emerald-800'
                    : 'text-red-800'
                }`}>
                  {serverStatus.agentCard ? serverStatus.agentCard.name : `${settings.host}:${settings.port}`}
                </span>
              </div>
            </div>
            {serverStatus.agentCard && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-xs text-blue-600 font-medium uppercase tracking-wide block">Agent</span>
                  <span className="text-sm text-blue-800 font-semibold">
                    v{serverStatus.agentCard.version}
                  </span>
                </div>
              </div>
            )}
            {serverStatus.agentCard?.skills && (
              <ToolsDisplay skills={serverStatus.agentCard.skills} />
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-200 hover:border-gray-300"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative">
        {hasMessages && (
          <div style={{ paddingBottom: '10%' }}>
            {messages.map((message) => (
              <ChatMessage key={message.message_id} message={message} />
            ))}

            {streamingState.isStreaming && (
              <>
                {!streamingState.currentResponse ? (
                  <div className="w-full px-4 py-3">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex justify-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 mt-1">
                          <Image src="/mascot_one.png" alt="Assistant" width={40} height={40} className="rounded-full shadow-sm" />
                        </div>
                        <div className="max-w-[70%]">
                          <div className="rounded-2xl px-4 py-3 shadow-sm bg-white border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full spinner"></div>
                              <span className="text-sm text-gray-600 font-medium">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <StreamingMessage
                    content={streamingState.currentResponse}
                    isComplete={false}
                  />
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div 
        className={`border-t border-gray-200/50 bg-white/80 backdrop-blur-md px-6 py-4 transition-all duration-500 ease-in-out shadow-sm ${
          hasMessages 
            ? 'relative' 
            : 'absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center border-t-0 shadow-lg'
        }`}
      >
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput
            onSendMessage={sendMessage}
            disabled={streamingState.isStreaming}
          />
        </div>
      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={updateSettings}
      />
    </div>
  );
}
