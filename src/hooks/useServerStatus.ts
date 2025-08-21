'use client';

import { useState, useEffect, useCallback } from 'react';

interface AgentCard {
  name: string;
  version: string;
  description: string;
  provider: {
    organization: string;
    url: string;
  };
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface ServerStatus {
  isOnline: boolean;
  isHealthy: boolean;
  agentCard: AgentCard | null;
  lastChecked: Date | null;
}

export function useServerStatus(host: string, port: number) {
  const [status, setStatus] = useState<ServerStatus>({
    isOnline: false,
    isHealthy: false,
    agentCard: null,
    lastChecked: null,
  });

  const checkServerStatus = useCallback(async () => {
    try {
      const baseUrl = `http://${host}:${port}`;

      // Check health endpoint first
      const healthResponse = await fetch(`${baseUrl}/health`, {
        method: 'GET',
      });

      if (!healthResponse.ok) {
        throw new Error('Server not healthy');
      }

      // If health check passes, try to get agent card
      let agentCard = null;
      try {
        const agentCardResponse = await fetch(`${baseUrl}/.well-known/agent-card.json`, {
          method: 'GET',
        });
        if (agentCardResponse.ok) {
          agentCard = await agentCardResponse.json();
        }
      } catch (error) {
        // Agent card is optional, don't fail if it's not available
        console.warn('Agent card not available:', error);
      }

      setStatus({
        isOnline: true,
        isHealthy: true,
        agentCard,
        lastChecked: new Date(),
      });
    } catch {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isHealthy: false,
        lastChecked: new Date(),
      }));
    }
  }, [host, port]);

  useEffect(() => {
    // Check immediately
    checkServerStatus();

    // Then check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, [host, port, checkServerStatus]);

  return status;
}