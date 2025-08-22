import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, JsonRpcRequest, StreamResponse } from '@/types/jsonrpc';
import { StreamSettings } from '@/components/Settings';

interface StreamingState {
  isStreaming: boolean;
  currentResponse: string;
  contextId: string | null;
  completed: boolean;
  error: string | null;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    const saved = localStorage.getItem('streamSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);
  const abortControllerRef = useRef<AbortController | null>(null);
  const completedRef = useRef<boolean>(false);
  const addingMessageRef = useRef<boolean>(false);

  const sendMessage = useCallback(async (text: string) => {
    if (streamingState.isStreaming) return;

    // API key is optional for local development

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    completedRef.current = false;
    addingMessageRef.current = false;

    const messageId = uuidv4();
    const requestId = uuidv4();

    const userMessage: Message = {
      role: 'user',
      parts: [{ kind: 'text', text }],
      message_id: messageId,
      kind: 'message',
      ...(streamingState.contextId && { contextId: streamingState.contextId }),
    };

    setMessages(prev => [...prev, userMessage]);
    setStreamingState({
      isStreaming: true,
      currentResponse: '',
      contextId: streamingState.contextId,
      completed: false,
      error: null,
    });

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'message/stream',
      params: {
        message: userMessage,
      },
      id: requestId,
    };

    try {
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

              if (data.result.kind === 'task' && data.result.contextId) {
                setStreamingState(prev => ({
                  ...prev,
                  contextId: data.result.contextId,
                }));

              }

              if (data.result.kind === 'artifact-update' && data.result.artifact) {
                const chunkText = data.result.artifact.parts
                  .map(part => part.text)
                  .join('');

                setStreamingState(prev => {
                  // If append is true, accumulate the text chunks
                  if (data.result.kind === 'artifact-update' && data.result.append) {
                    return {
                      ...prev,
                      currentResponse: prev.currentResponse + chunkText,
                    };
                  } else {
                    // If append is false/undefined, replace the content
                    return {
                      ...prev,
                      currentResponse: chunkText,
                    };
                  }
                });
              }

              if (data.result.kind === 'status-update' && data.result.final) {
                setStreamingState(prev => {
                  if (!prev.isStreaming) {
                    console.log('Not streaming, ignoring final status');
                    return prev;
                  }

                  const finalResponse = prev.currentResponse;
                  console.log('Final response to save:', finalResponse);

                  if (finalResponse) {
                    const assistantMessage: Message = {
                      role: 'agent',
                      parts: [{ kind: 'text', text: finalResponse }],
                      message_id: uuidv4(),
                      kind: 'message',
                      contextId: prev.contextId || undefined,
                    };

                    setMessages(prevMessages => {
                      // Check if we already have a message with the same content
                      const lastMessage = prevMessages[prevMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'agent' &&
                          lastMessage.parts[0]?.text === finalResponse) {
                        console.log('Duplicate message detected, not adding');
                        return prevMessages;
                      }
                      console.log('Adding new message to history');
                      return [...prevMessages, assistantMessage];
                    });
                  }

                  return {
                    ...prev,
                    isStreaming: false,
                    currentResponse: '',
                    completed: true,
                    error: null,
                  };
                });
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
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
    }
  }, [streamingState, settings]);

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

  const updateSettings = useCallback((newSettings: StreamSettings) => {
    setSettings(newSettings);
  }, []);

  const clearError = useCallback(() => {
    setStreamingState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    messages,
    streamingState,
    settings,
    sendMessage,
    stopStreaming,
    updateSettings,
    clearError,
  };
}