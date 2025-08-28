'use client';

import { useConversations } from '@/components/ConversationProvider';
import { useServerStatus } from '@/hooks/useServerStatus';
import ChatMessage from '@/components/ChatMessage';
import StreamingMessage from '@/components/StreamingMessage';
import ChatInput from '@/components/ChatInput';
import Settings from '@/components/Settings';
import ToolsDisplay from '@/components/ToolsDisplay';
import ConversationSidebar from '@/components/ConversationSidebar';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const {
    conversations,
    metadata,
    activeConversationId,
    currentConversation,
    currentMetadata,
    streamingState,
    settings,
    sendMessage,
    updateSettings,
    clearError,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const serverStatus = useServerStatus(settings.host, Number(settings.port));
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = currentConversation.length > 0;

  // Auto-create first conversation if none exists
  useEffect(() => {
    if (Object.keys(conversations).length === 0 && !activeConversationId) {
      createConversation('New Conversation');
    }
  }, [conversations, activeConversationId, createConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation, streamingState.currentResponse]);

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={metadata}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversation}
        onCreateConversation={() => createConversation()}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        isOpen={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                title="Toggle conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="text-xl font-semibold tracking-tight">AgentUp</h1>

              {/* Current Conversation Info */}
              {activeConversationId && currentMetadata && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <p className="text-sm text-gray-700 font-medium truncate max-w-xs">
                    {currentMetadata.title}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              serverStatus.isOnline && serverStatus.isHealthy
                ? 'bg-gray-50 border-gray-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                serverStatus.isOnline && serverStatus.isHealthy
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}></div>
              <div className="text-right">
                <span className={`text-sm ${
                  serverStatus.isOnline && serverStatus.isHealthy
                    ? 'text-gray-700'
                    : 'text-red-700'
                }`}>
                  {serverStatus.isOnline && serverStatus.isHealthy 
                    ? (serverStatus.agentCard?.name || 'Connected')
                    : 'Offline'}
                </span>
              </div>
            </div>
            {serverStatus.agentCard?.skills && (
              <ToolsDisplay skills={serverStatus.agentCard.skills} />
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-150 ${
                showSettings 
                  ? 'bg-gray-100 border-gray-300 text-gray-900' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
              title="Connection Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Settings</span>
            </button>
            </div>
          </div>
        </header>

        {streamingState.error && (
          <div className="mx-4 mt-3 mb-2">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-red-900 font-medium text-sm">{streamingState.error}</p>
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="Dismiss error"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative">
          {hasMessages && (
            <div style={{ paddingBottom: '10%' }}>
              {currentConversation.map((message) => (
                <ChatMessage key={message.message_id} message={message} />
              ))}

              {streamingState.isStreaming && (
                <>
                  {!streamingState.currentResponse ? (
                    <div className="w-full px-4 py-3">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex justify-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 mt-1">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="max-w-[70%]">
                            <div className="rounded-lg px-4 py-3 bg-white border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full spinner"></div>
                                <span className="text-sm text-gray-600">Thinking...</span>
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

          {/* Empty State */}
          {!hasMessages && !streamingState.isStreaming && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Start a conversation</h3>
                <p className="text-gray-500 text-sm max-w-sm">Send a message to begin chatting with the AI agent.</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput
              onSendMessage={sendMessage}
              disabled={streamingState.isStreaming}
            />
          </div>
        </div>

        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => {
            updateSettings(newSettings);
            setShowSettings(false);
          }}
        />
      </div>
    </div>
  );
}
