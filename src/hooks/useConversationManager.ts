import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Message, 
  MessagePart, 
  ConversationMetadata,
  StreamingState,
  JsonRpcRequest,
  StreamResponse
} from '@/types/jsonrpc';
import { StreamSettings } from '@/components/Settings';

const STORAGE_KEYS = {
  conversations: 'streamchat-conversations',
  metadata: 'streamchat-conversation-metadata',
  settings: 'streamSettings',
  active: 'streamchat-active-conversation'
};

export function useConversationManager() {
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [metadata, setMetadata] = useState<Record<string, ConversationMetadata>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentResponse: '',
    contextId: null,
    completed: false,
    error: null,
  });

  const [settings, setSettings] = useState<StreamSettings>({
    host: 'localhost',
    port: '8000',
    apiKey: ''
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingStateRef = useRef<StreamingState>(streamingState);
  
  // Keep ref in sync with state
  useEffect(() => {
    streamingStateRef.current = streamingState;
  }, [streamingState]);

  // Only load settings on mount (keep settings persistence)
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.warn('Failed to load persisted settings:', error);
    }
  }, []);

  // Generate unique IDs
  const generateId = useCallback(() => uuidv4(), []);

  // Create a new conversation
  const createConversation = useCallback((title?: string): string => {
    const conversationId = generateId();
    const now = new Date().toISOString();
    
    const conversationMetadata: ConversationMetadata = {
      id: conversationId,
      title: title || `Conversation ${Object.keys(metadata).length + 1}`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    setConversations(prev => ({
      ...prev,
      [conversationId]: []
    }));
    
    setMetadata(prev => ({
      ...prev,
      [conversationId]: conversationMetadata
    }));
    
    setActiveConversationId(conversationId);

    return conversationId;
  }, [generateId, metadata]);

  // Switch to a conversation
  const switchToConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    setStreamingState(prev => ({
      ...prev,
      contextId: conversationId,
      currentResponse: '',
      error: null,
    }));
  }, []);

  // Get conversation history with optional limit
  const getConversationHistory = useCallback((
    conversationId: string, 
    maxMessages = 20
  ): Message[] => {
    const messages = conversations[conversationId] || [];
    return messages.slice(-maxMessages);
  }, [conversations]);

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: Message) => {
    console.log('➕ Adding message to conversation:', {
      conversationId,
      role: message.role,
      messageId: message.message_id,
      text: message.parts[0]?.text?.substring(0, 50) + '...'
    });
    
    setConversations(prev => {
      const updatedMessages = [...(prev[conversationId] || []), message];
      
      console.log('📚 Updated conversation length:', updatedMessages.length);
      
      // Also update metadata with the correct message count
      setMetadata(metaPrev => {
        const now = new Date().toISOString();
        return {
          ...metaPrev,
          [conversationId]: {
            ...metaPrev[conversationId],
            updatedAt: now,
            messageCount: updatedMessages.length,
          }
        };
      });
      
      return {
        ...prev,
        [conversationId]: updatedMessages
      };
    });
  }, []);

  // Create user message
  const createUserMessage = useCallback((
    conversationId: string,
    text: string,
    taskId?: string
  ): Message => {
    return {
      role: 'user',
      parts: [{ kind: 'text', text }],
      message_id: generateId(),
      kind: 'message',
      contextId: conversationId,
      taskId: taskId || generateId(),
    };
  }, [generateId]);

  // Create agent message
  const createAgentMessage = useCallback((
    conversationId: string,
    parts: MessagePart[],
    taskId?: string
  ): Message => {
    return {
      role: 'agent',
      parts,
      message_id: generateId(),
      kind: 'message',
      contextId: conversationId,
      taskId: taskId || generateId(),
    };
  }, [generateId]);

  // Send message with streaming
  const sendMessage = useCallback(async (text: string, conversationId?: string) => {
    const activeId = conversationId || activeConversationId;
    
    if (!activeId) {
      const newConversationId = createConversation();
      return sendMessage(text, newConversationId);
    }

    if (streamingState.isStreaming) return;

    // Abort any ongoing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const taskId = generateId();
    const userMessage = createUserMessage(activeId, text, taskId);

    console.log('📝 Sending message with context_id:', {
      conversationId: activeId,
      messageText: text,
      messageId: userMessage.message_id
    });

    // Add user message immediately
    addMessage(activeId, userMessage);

    // Set streaming state
    setStreamingState({
      isStreaming: true,
      currentResponse: '',
      contextId: activeId,
      completed: false,
      error: null,
    });

    setIsLoading(prev => ({ ...prev, [activeId]: true }));

    try {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'message/stream',
        params: {
          message: userMessage,
        },
        id: generateId(),
      };
      
      console.log('🚀 Sending request (server manages history):', {
        messageText: userMessage.parts[0]?.text,
        contextId: userMessage.contextId,
        fullRequest: JSON.stringify(request, null, 2)
      });

      const streamUrl = `http://${settings.host}:${settings.port}/`;
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { 'X-API-Key': settings.apiKey }),
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const errorText = await response.text();
          let errorMessage = 'Authentication failed';
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.detail === 'Unauthorized') {
              errorMessage = 'Authentication failed: Invalid API key or missing authentication';
            }
          } catch {
            errorMessage = 'Authentication failed: Unauthorized access';
          }
          
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            error: errorMessage,
          }));
          return;
        }
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      let isFinalReceived = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamResponse = JSON.parse(line.slice(6));

              if (data.result.kind === 'artifact-update' && data.result.artifact) {
                const chunkText = data.result.artifact.parts
                  .map(part => part.text || '')
                  .join('');

                setStreamingState(prev => {
                  // Check the append flag correctly
                  if (data.result.append) {
                    return {
                      ...prev,
                      currentResponse: prev.currentResponse + chunkText,
                    };
                  } else {
                    return {
                      ...prev,
                      currentResponse: chunkText,
                    };
                  }
                });
              }

              if (data.result.kind === 'status-update' && data.result.final) {
                isFinalReceived = true;
                // Don't process the final message here, wait until stream ends
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      }
      
      // Process final message after stream ends to ensure all chunks are received
      if (isFinalReceived) {
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const finalResponse = streamingStateRef.current.currentResponse;
        
        console.log('✅ Stream completed, saving agent response:', {
          responseLength: finalResponse?.length,
          responsePreview: finalResponse?.substring(0, 100) + '...'
        });
        
        if (finalResponse) {
          const agentMessage = createAgentMessage(
            activeId,
            [{ kind: 'text', text: finalResponse }],
            taskId
          );
          
          addMessage(activeId, agentMessage);
          
          console.log('💾 Agent message saved to conversation:', {
            conversationId: activeId,
            messageId: agentMessage.message_id,
            role: agentMessage.role
          });
        }
        
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          currentResponse: '',
          completed: true,
          error: null,
        }));
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream error:', error);
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          currentResponse: '',
          error: 'Connection error: ' + error.message,
        }));
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [activeId]: false }));
    }
  }, [
    activeConversationId,
    streamingState.isStreaming,
    settings,
    generateId,
    createUserMessage,
    createAgentMessage,
    addMessage,
    getConversationHistory,
    createConversation
  ]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      currentResponse: '',
      completed: true,
      error: null,
    }));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: StreamSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(newSettings));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setStreamingState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const newConversations = { ...prev };
      delete newConversations[conversationId];
      return newConversations;
    });
    
    setMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[conversationId];
      return newMetadata;
    });
    
    if (activeConversationId === conversationId) {
      const remainingIds = Object.keys(conversations).filter(id => id !== conversationId);
      setActiveConversationId(remainingIds[0] || null);
    }
  }, [activeConversationId, conversations]);

  // Rename conversation
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    setMetadata(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        title: newTitle,
        updatedAt: new Date().toISOString(),
      }
    }));
  }, []);


  // Get current conversation data
  const currentConversation = activeConversationId 
    ? conversations[activeConversationId] || []
    : [];

  const currentMetadata = activeConversationId 
    ? metadata[activeConversationId]
    : null;

  return {
    // State
    conversations,
    metadata,
    activeConversationId,
    currentConversation,
    currentMetadata,
    streamingState,
    settings,
    isLoading,

    // Actions
    createConversation,
    setActiveConversation: switchToConversation,
    sendMessage,
    stopStreaming,
    updateSettings,
    clearError,
    deleteConversation,
    renameConversation,
    getConversationHistory,
    addMessage,
    createUserMessage,
    createAgentMessage,
  };
}