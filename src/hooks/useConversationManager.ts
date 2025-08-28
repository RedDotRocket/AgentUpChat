import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Message,
  MessagePart,
  ConversationMetadata,
  StreamingState,
  JsonRpcRequest,
  StreamResponse,
} from "@/types/jsonrpc";
import { StreamSettings } from "@/components/Settings";

const STORAGE_KEYS = {
  conversations: "streamchat-conversations",
  metadata: "streamchat-conversation-metadata",
  settings: "streamSettings",
  active: "streamchat-active-conversation",
};

export function useConversationManager() {
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    {},
  );
  const [metadata, setMetadata] = useState<
    Record<string, ConversationMetadata>
  >({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentResponse: "",
    previousResponses: [],
    contextId: null,
    taskId: null,
    completed: false,
    error: null,
    status: null,
    statusMessage: null,
    completionMetadata: null,
  });

  const [settings, setSettings] = useState<StreamSettings>({
    host: "localhost",
    port: "8000",
    apiKey: "",
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
      console.warn("Failed to load persisted settings:", error);
    }
  }, []);

  // Generate unique IDs
  const generateId = useCallback(() => uuidv4(), []);

  // Create a new conversation
  const createConversation = useCallback(
    (title?: string): string => {
      const conversationId = generateId();
      const now = new Date().toISOString();

      const conversationMetadata: ConversationMetadata = {
        id: conversationId,
        title: title || `Conversation ${Object.keys(metadata).length + 1}`,
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
      };

      setConversations((prev) => ({
        ...prev,
        [conversationId]: [],
      }));

      setMetadata((prev) => ({
        ...prev,
        [conversationId]: conversationMetadata,
      }));

      setActiveConversationId(conversationId);

      return conversationId;
    },
    [generateId, metadata],
  );

  // Switch to a conversation
  const switchToConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    setStreamingState((prev) => ({
      ...prev,
      contextId: conversationId,
      taskId: null,
      currentResponse: "",
      previousResponses: [],
      error: null,
    }));
  }, []);

  // Get conversation history with optional limit
  const getConversationHistory = useCallback(
    (conversationId: string, maxMessages = 20): Message[] => {
      const messages = conversations[conversationId] || [];
      return messages.slice(-maxMessages);
    },
    [conversations],
  );

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: Message) => {
    setConversations((prev) => {
      const updatedMessages = [...(prev[conversationId] || []), message];

      // Also update metadata with the correct message count
      setMetadata((metaPrev) => {
        const now = new Date().toISOString();
        return {
          ...metaPrev,
          [conversationId]: {
            ...metaPrev[conversationId],
            updatedAt: now,
            messageCount: updatedMessages.length,
          },
        };
      });

      return {
        ...prev,
        [conversationId]: updatedMessages,
      };
    });
  }, []);

  // Create user message
  const createUserMessage = useCallback(
    (conversationId: string, text: string): Message => {
      const message: Message = {
        role: "user",
        parts: [{ kind: "text", text }],
        message_id: generateId(),
        kind: "message",
      };
      
      // Include contextId and taskId if available from server
      if (streamingState.contextId && streamingState.taskId) {
        message.contextId = streamingState.contextId;
        message.taskId = streamingState.taskId;
      }
      
      return message;
    },
    [generateId, streamingState.contextId, streamingState.taskId],
  );

  // Create agent message
  const createAgentMessage = useCallback(
    (
      conversationId: string,
      parts: MessagePart[],
      completionMetadata?: {
        confidence: number | null;
        executionTime: string | null;
        tasksCompleted: string[] | null;
        finalStatus: string | null;
        iterationsCompleted: number | null;
        summary: string | null;
      }
    ): Message => {
      return {
        role: "agent",
        parts,
        message_id: generateId(),
        kind: "message",
        metadata: completionMetadata,
      };
    },
    [generateId],
  );

  // Send message with streaming
  const sendMessage = useCallback(
    async (text: string, conversationId?: string) => {
      const activeId = conversationId || activeConversationId;

      if (!activeId) {
        const newConversationId = createConversation();
        return sendMessage(text, newConversationId);
      }

      if (streamingState.isStreaming) return;

      // Abort any ongoing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMessage = createUserMessage(activeId, text);

      // Add user message immediately
      addMessage(activeId, userMessage);

      // Set streaming state
      setStreamingState({
        isStreaming: true,
        currentResponse: "",
        previousResponses: [],
        contextId: activeId,
        taskId: null,
        completed: false,
        error: null,
        status: null,
        statusMessage: null,
        completionMetadata: null,
      });

      setIsLoading((prev) => ({ ...prev, [activeId]: true }));

      try {
        const request: JsonRpcRequest = {
          jsonrpc: "2.0",
          method: "message/stream",
          params: {
            message: userMessage,
          },
          id: generateId(),
        };

        const streamUrl = `http://${settings.host}:${settings.port}/`;
        const response = await fetch(streamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(settings.apiKey && { "X-API-Key": settings.apiKey }),
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            const errorText = await response.text();
            let errorMessage = "Authentication failed";

            try {
              const errorData = JSON.parse(errorText);
              if (errorData.detail === "Unauthorized") {
                errorMessage =
                  "Authentication failed: Invalid API key or missing authentication";
              }
            } catch {
              errorMessage = "Authentication failed: Unauthorized access";
            }

            setStreamingState((prev) => ({
              ...prev,
              isStreaming: false,
              currentResponse: "",
              previousResponses: [],
              error: errorMessage,
              status: null,
              statusMessage: null,
              completionMetadata: null,
            }));
            return;
          }
          throw new Error("Stream request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        let isFinalReceived = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamResponse = JSON.parse(line.slice(6));

                // Add defensive check for data.result
                if (!data.result) {
                  continue;
                }

                // Capture contextId and taskId from server response
                if (data.result.contextId) {
                  setStreamingState((prev) => ({
                    ...prev,
                    contextId: data.result.contextId,
                    ...(('taskId' in data.result && data.result.taskId) && { taskId: data.result.taskId }),
                  }));
                }

                if (
                  data.result.kind === "artifact-update" &&
                  data.result.artifact
                ) {
                  
                  // Check if this is a completion metadata artifact (contains completion data)
                  const completionDataPart = data.result.artifact.parts.find(part => 
                    part.kind === "data" && 
                    part.data && 
                    typeof part.data === "object" &&
                    ("completion_approved" in part.data || "completion_confidence" in part.data)
                  );

                  if (completionDataPart) {
                    // This is a completion metadata artifact - extract the metadata
                    const completionData = completionDataPart.data;
                    
                    setStreamingState((prev) => ({
                      ...prev,
                      completionMetadata: {
                        confidence: completionData.completion_confidence || null,
                        executionTime: completionData.total_execution_time || null,
                        tasksCompleted: completionData.tasks_completed || null,
                        finalStatus: completionData.final_status || null,
                        iterationsCompleted: completionData.iterations_completed || null,
                        summary: completionData.completion_summary || null,
                      }
                    }));

                    // Also process any text parts from completion artifact (like "Goal completed" message)
                    const completionTextParts = data.result.artifact.parts
                      .filter(part => part.kind === "text")
                      .map(part => part.text || "")
                      .filter(text => text.trim());

                    if (completionTextParts.length > 0) {
                      const completionText = completionTextParts.join("");
                    }
                  } else {
                    // This is a regular content artifact - process as main response
                    const chunkText = data.result.artifact.parts
                      .filter(part => part.kind === "text")
                      .map((part) => part.text || "")
                      .join("");

                    if (chunkText.trim()) {
                      setStreamingState((prev) => {
                        // Handle append flag: true = append, false/null = replace
                        if (data.result.append === true) {
                          const newResponse = prev.currentResponse + chunkText;
                          return {
                            ...prev,
                            currentResponse: newResponse,
                          };
                        } else {
                          // When starting a new response chunk, preserve the previous one
                          const newPreviousResponses = prev.currentResponse.trim() 
                            ? [...prev.previousResponses, prev.currentResponse]
                            : prev.previousResponses;
                            
                          return {
                            ...prev,
                            currentResponse: chunkText,
                            previousResponses: newPreviousResponses,
                          };
                        }
                      });
                    }
                  }
                }

                if (data.result.kind === "status-update") {
                  // Update streaming status for user feedback
                  setStreamingState((prev) => ({
                    ...prev,
                    status: data.result.status.state,
                    statusMessage: data.result.status.message?.parts
                      .map((part) => part.text || "")
                      .join("") || null,
                  }));

                  if (data.result.final) {
                    isFinalReceived = true;
                    // Don't process the final message here, wait until stream ends
                  }
                }
              } catch (error) {
                console.error("Error parsing stream data:", error);
              }
            }
          }
        }

        // Process final message after stream ends to ensure all chunks are received
        if (isFinalReceived) {
          // Small delay to ensure state is updated
          await new Promise((resolve) => setTimeout(resolve, 100));

          const finalResponse = streamingStateRef.current.currentResponse;
          const previousResponses = streamingStateRef.current.previousResponses;
          const completionMetadata = streamingStateRef.current.completionMetadata;

          // Combine all response chunks into the final message
          const allResponses = [...previousResponses];
          if (finalResponse.trim()) {
            allResponses.push(finalResponse);
          }
          
          const combinedResponse = allResponses.join('\n\n');

          if (combinedResponse.trim()) {
            const agentMessage = createAgentMessage(
              activeId,
              [{ kind: "text", text: combinedResponse }],
              completionMetadata || undefined
            );
            addMessage(activeId, agentMessage);
          }

          setStreamingState((prev) => ({
            ...prev,
            isStreaming: false,
            currentResponse: "",
            previousResponses: [],
            completed: true,
            error: null,
            status: null,
            statusMessage: null,
            completionMetadata: null,
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Stream error:", error);
          setStreamingState((prev) => ({
            ...prev,
            isStreaming: false,
            currentResponse: "",
            previousResponses: [],
            error: "Connection error: " + error.message,
            status: null,
            statusMessage: null,
            completionMetadata: null,
          }));
        }
      } finally {
        setIsLoading((prev) => ({ ...prev, [activeId]: false }));
      }
    },
    [
      activeConversationId,
      streamingState.isStreaming,
      settings,
      generateId,
      createUserMessage,
      createAgentMessage,
      addMessage,
      createConversation,
    ],
  );

  // Stop streaming
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreamingState((prev) => ({
      ...prev,
      isStreaming: false,
      currentResponse: "",
      previousResponses: [],
      completed: true,
      error: null,
      status: null,
      statusMessage: null,
      completionMetadata: null,
    }));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: StreamSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(newSettings));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setStreamingState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const newConversations = { ...prev };
        delete newConversations[conversationId];
        return newConversations;
      });

      setMetadata((prev) => {
        const newMetadata = { ...prev };
        delete newMetadata[conversationId];
        return newMetadata;
      });

      if (activeConversationId === conversationId) {
        const remainingIds = Object.keys(conversations).filter(
          (id) => id !== conversationId,
        );
        setActiveConversationId(remainingIds[0] || null);
      }
    },
    [activeConversationId, conversations],
  );

  // Rename conversation
  const renameConversation = useCallback(
    (conversationId: string, newTitle: string) => {
      setMetadata((prev) => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          title: newTitle,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [],
  );

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
