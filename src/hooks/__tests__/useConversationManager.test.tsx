import { renderHook, act } from '@testing-library/react';
import { useConversationManager } from '../useConversationManager';
import { Message } from '@/types/jsonrpc';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('useConversationManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useConversationManager());

    expect(result.current.conversations).toEqual({});
    expect(result.current.metadata).toEqual({});
    expect(result.current.activeConversationId).toBeNull();
    expect(result.current.currentConversation).toEqual([]);
    expect(result.current.currentMetadata).toBeNull();
  });

  it('should create a new conversation', () => {
    const { result } = renderHook(() => useConversationManager());
    let conversationId: string;

    act(() => {
      conversationId = result.current.createConversation('Test Conversation');
    });

    expect(conversationId!).toBeTruthy();
    expect(result.current.activeConversationId).toBe(conversationId!);
    expect(result.current.metadata[conversationId!].title).toBe('Test Conversation');
    expect(result.current.conversations[conversationId!]).toEqual([]);
  });

  it('should switch between conversations', () => {
    const { result } = renderHook(() => useConversationManager());
    let conv1: string, conv2: string;

    act(() => {
      conv1 = result.current.createConversation('Conversation 1');
    });
    
    act(() => {
      conv2 = result.current.createConversation('Conversation 2');
    });
    
    expect(result.current.activeConversationId).toBe(conv2!);
    
    act(() => {
      result.current.setActiveConversation(conv1!);
    });
    
    expect(result.current.activeConversationId).toBe(conv1!);
  });

  it('should create user and agent messages', () => {
    const { result } = renderHook(() => useConversationManager());

    act(() => {
      const conversationId = result.current.createConversation();
      
      const userMessage = result.current.createUserMessage(conversationId, 'Hello');
      expect(userMessage.role).toBe('user');
      expect(userMessage.parts[0].text).toBe('Hello');
      expect(userMessage.contextId).toBe(conversationId);
      
      const agentMessage = result.current.createAgentMessage(
        conversationId, 
        [{ kind: 'text', text: 'Hi there!' }]
      );
      expect(agentMessage.role).toBe('agent');
      expect(agentMessage.parts[0].text).toBe('Hi there!');
      expect(agentMessage.contextId).toBe(conversationId);
    });
  });

  it('should add messages to conversations', () => {
    const { result } = renderHook(() => useConversationManager());
    let conversationId: string;
    let userMessage: Message;

    act(() => {
      conversationId = result.current.createConversation();
      userMessage = result.current.createUserMessage(conversationId!, 'Hello');
    });
    
    act(() => {
      result.current.addMessage(conversationId!, userMessage);
    });
    
    expect(result.current.conversations[conversationId!]).toHaveLength(1);
    expect(result.current.conversations[conversationId!][0]).toBe(userMessage);
    expect(result.current.metadata[conversationId!].messageCount).toBe(1);
  });

  it('should get conversation history with limit', () => {
    const { result } = renderHook(() => useConversationManager());
    let conversationId: string;

    act(() => {
      conversationId = result.current.createConversation();
    });
    
    // Add multiple messages
    act(() => {
      for (let i = 0; i < 25; i++) {
        const message = result.current.createUserMessage(conversationId!, `Message ${i}`);
        result.current.addMessage(conversationId!, message);
      }
    });
    
    const history = result.current.getConversationHistory(conversationId!, 20);
    expect(history).toHaveLength(20);
    expect(history[0].parts[0].text).toBe('Message 5'); // Should start from the 6th message
    expect(history[19].parts[0].text).toBe('Message 24'); // Should end at the last message
  });

  it('should delete conversations', () => {
    const { result } = renderHook(() => useConversationManager());
    let conv1: string, conv2: string;

    act(() => {
      conv1 = result.current.createConversation('Conversation 1');
    });
    
    act(() => {
      conv2 = result.current.createConversation('Conversation 2');
    });
    
    act(() => {
      result.current.deleteConversation(conv1!);
    });
    
    expect(result.current.conversations[conv1!]).toBeUndefined();
    expect(result.current.metadata[conv1!]).toBeUndefined();
    expect(result.current.activeConversationId).toBe(conv2!);
  });

  it('should rename conversations', () => {
    const { result } = renderHook(() => useConversationManager());
    let conversationId: string;

    act(() => {
      conversationId = result.current.createConversation('Original Title');
    });
    
    act(() => {
      result.current.renameConversation(conversationId!, 'New Title');
    });
    
    expect(result.current.metadata[conversationId!].title).toBe('New Title');
  });

  it('should persist data to localStorage', () => {
    const { result } = renderHook(() => useConversationManager());

    act(() => {
      const conversationId = result.current.createConversation('Test Conversation');
      const message = result.current.createUserMessage(conversationId, 'Hello');
      result.current.addMessage(conversationId, message);
    });

    // Check that data was saved to localStorage
    expect(localStorageMock.getItem('streamchat-conversations')).toBeTruthy();
    expect(localStorageMock.getItem('streamchat-conversation-metadata')).toBeTruthy();
    expect(localStorageMock.getItem('streamchat-active-conversation')).toBeTruthy();
  });

  it('should load data from localStorage', () => {
    const testData = {
      conversations: {
        'test-id': [
          {
            role: 'user',
            parts: [{ kind: 'text', text: 'Hello' }],
            message_id: 'msg-1',
            kind: 'message',
            contextId: 'test-id',
          }
        ]
      },
      metadata: {
        'test-id': {
          id: 'test-id',
          title: 'Test Conversation',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          messageCount: 1,
        }
      },
      active: 'test-id'
    };

    localStorageMock.setItem('streamchat-conversations', JSON.stringify(testData.conversations));
    localStorageMock.setItem('streamchat-conversation-metadata', JSON.stringify(testData.metadata));
    localStorageMock.setItem('streamchat-active-conversation', testData.active);

    const { result } = renderHook(() => useConversationManager());

    expect(result.current.conversations).toEqual(testData.conversations);
    expect(result.current.metadata).toEqual(testData.metadata);
    expect(result.current.activeConversationId).toBe(testData.active);
  });
});