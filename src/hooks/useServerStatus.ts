'use client';

import { useState, useEffect } from 'react';

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

  const checkServerStatus = async () => {
    try {
      const baseUrl = `http://${host}:${port}`;
      
      // Check health endpoint
      const healthResponse = await fetch(`${baseUrl}/.well-known/agent-card.json`, {
        method: 'GET',
        timeout: 5000,
      } as any);

      if (healthResponse.ok) {
        const agentCard = await healthResponse.json();
        
        setStatus({
          isOnline: true,
          isHealthy: true,
          agentCard,
          lastChecked: new Date(),
        });
      } else {
        throw new Error('Server not healthy');
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isHealthy: false,
        lastChecked: new Date(),
      }));
    }
  };

  useEffect(() => {
    // Check immediately
    checkServerStatus();

    // Then check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, [host, port]);

  return status;
}