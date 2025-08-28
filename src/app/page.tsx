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
  const [showWelcome, setShowWelcome] = useState(true);


  // Reset welcome state when switching to a conversation with messages
  useEffect(() => {
    if (hasMessages) {
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }
  }, [hasMessages, activeConversationId]);

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
          {(hasMessages || streamingState.isStreaming) && (
            <div style={{ paddingBottom: '10%' }}>
              {currentConversation.map((message) => (
                <ChatMessage key={message.message_id} message={message} />
              ))}

              {streamingState.isStreaming && (
                <>
                  {!streamingState.currentResponse || streamingState.currentResponse.trim().length === 0 ? (
                    <div className="w-full px-4 py-3">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex justify-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 mt-1">
                            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                              </svg>
                            </div>
                          </div>
                          <div className="max-w-[70%]">
                            <div className="rounded-lg px-4 py-3 bg-white border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full spinner animate-spin"></div>
                                <span className="text-sm text-gray-600">
                                  {streamingState.status === 'working' 
                                    ? (streamingState.statusMessage || 'Working...') 
                                    : 'Thinking...'}
                                </span>
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
                      completionMetadata={streamingState.completionMetadata}
                    />
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input - Conditional positioning */}
        {showWelcome && !hasMessages && !streamingState.isStreaming ? (
          /* Welcome State - Centered Input */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full max-w-2xl mx-auto px-6 pointer-events-auto">
              {/* Welcome Message */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h1>
                <p className="text-gray-500 text-sm">I am an Autonomous Agent, built with AgentUp</p>
              </div>
              
              {/* Centered Chat Input */}
              <ChatInput
                onSendMessage={(message) => {
                  setShowWelcome(false);
                  sendMessage(message);
                }}
                disabled={streamingState.isStreaming}
              />
            </div>
          </div>
        ) : (
          /* Chat State - Bottom Input */
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="max-w-4xl mx-auto w-full">
              <ChatInput
                onSendMessage={sendMessage}
                disabled={streamingState.isStreaming}
              />
            </div>
          </div>
        )}

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
