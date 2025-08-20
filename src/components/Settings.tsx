'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const saved = localStorage.getItem('streamSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('streamSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Stream Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host
            </label>
            <input
              type="text"
              value={settings.host}
              onChange={(e) => setSettings({...settings, host: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="localhost"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="text"
              value={settings.port}
              onChange={(e) => setSettings({...settings, port: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={settings.apiKey}
              onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your API key"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}