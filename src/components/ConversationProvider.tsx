'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useConversationManager } from '@/hooks/useConversationManager';
import { 
  ConversationState, 
  ConversationMetadata, 
  StreamingState,
  Message,
  MessagePart
} from '@/types/jsonrpc';
import { StreamSettings } from '@/components/Settings';

interface ConversationContextType {
  // State
  conversations: ConversationState;
  metadata: Record<string, ConversationMetadata>;
  activeConversationId: string | null;
  currentConversation: Message[];
  currentMetadata: ConversationMetadata | null;
  streamingState: StreamingState;
  settings: StreamSettings;
  isLoading: Record<string, boolean>;

  // Actions
  createConversation: (title?: string) => string;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (text: string, conversationId?: string) => Promise<void>;
  stopStreaming: () => void;
  updateSettings: (settings: StreamSettings) => void;
  clearError: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  getConversationHistory: (conversationId: string, maxMessages?: number) => Message[];
  addMessage: (conversationId: string, message: Message) => void;
  createUserMessage: (conversationId: string, text: string, taskId?: string) => Message;
  createAgentMessage: (conversationId: string, parts: MessagePart[], taskId?: string) => Message;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const conversationManager = useConversationManager();

  return (
    <ConversationContext.Provider value={conversationManager}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
}