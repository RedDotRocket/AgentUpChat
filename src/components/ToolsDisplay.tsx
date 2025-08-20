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

  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-all duration-200"
        title="Available Tools"
      >
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <span className="text-xs text-amber-600 font-medium uppercase tracking-wide block">Tools</span>
          <span className="text-sm text-amber-800 font-semibold">{skills.length}</span>
        </div>
      </button>
      
      {mounted && isOpen && createPortal(
        <div 
          className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
          style={{ 
            position: 'fixed',
            top: `${position.top}px`,
            right: `${position.right}px`,
            zIndex: 10000
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Tools ({skills.length})</h3>
            <div className="space-y-2">
              {skills.map((skill) => (
                <div key={skill.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{skill.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{skill.description}</p>
                    </div>
                    {skill.tags && skill.tags.length > 0 && (
                      <span className="ml-2 flex-shrink-0 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
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