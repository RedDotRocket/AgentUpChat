'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: StreamSettings) => void;
}

export interface StreamSettings {
  host: string;
  port: string;
  apiKey: string;
}

export default function Settings({ isOpen, onClose, onSave }: SettingsProps) {
  const [settings, setSettings] = useState<StreamSettings>({
    host: 'localhost',
    port: '8000',
    apiKey: ''
  });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('streamSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Set button ref from parent
  useEffect(() => {
    const settingsButton = document.querySelector('[title="Connection Settings"]') as HTMLButtonElement;
    if (settingsButton) {
      buttonRef.current = settingsButton;
    }
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Check if click is inside the settings panel
        const settingsPanel = document.getElementById('settings-dropdown');
        if (settingsPanel && !settingsPanel.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    localStorage.setItem('streamSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      id="settings-dropdown"
      className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in"
      style={{ 
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 10000
      }}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900">Connection Settings</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Close settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Form content */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Host
          </label>
          <input
            type="text"
            value={settings.host}
            onChange={(e) => setSettings({...settings, host: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
            placeholder="localhost"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Port
          </label>
          <input
            type="text"
            value={settings.port}
            onChange={(e) => setSettings({...settings, port: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
            placeholder="8000"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            API Key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
            placeholder="Enter your API key"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}