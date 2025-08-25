'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useConversationManager } from '@/hooks/useConversationManager';

// Define the context type based on the return type of useConversationManager
type ConversationContextType = ReturnType<typeof useConversationManager>;

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