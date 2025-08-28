'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Skill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
}

interface ToolsDisplayProps {
  skills: Skill[];
}

export default function ToolsDisplay({ skills }: ToolsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
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

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-150 ${
          isOpen 
            ? 'bg-gray-100 border-gray-300 text-gray-900' 
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
        }`}
        title="Available Tools"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
        <span className="text-sm font-medium">{skills.length} tools</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${
          isOpen ? 'rotate-180' : 'rotate-0'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {mounted && isOpen && createPortal(
        <div 
          className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-hidden animate-fade-in"
          style={{ 
            position: 'fixed',
            top: `${position.top}px`,
            right: `${position.right}px`,
            zIndex: 10000
          }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Available Tools ({skills.length})</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Close tools panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="p-3 space-y-2">
              {skills.map((skill) => (
                <div key={skill.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-black">{skill.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{skill.description}</p>
                    </div>
                    {skill.tags && skill.tags.length > 0 && (
                      <span className="ml-2 flex-shrink-0 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-md font-medium">
                        {skill.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}