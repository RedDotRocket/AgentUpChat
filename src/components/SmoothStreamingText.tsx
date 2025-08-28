'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SmoothStreamingTextProps {
  text: string;
  speed?: number;
  renderMarkdown?: boolean;
}

export default function SmoothStreamingText({ text, speed = 50, renderMarkdown = false }: SmoothStreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTextRef = useRef('');

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If text got shorter (new message), reset immediately
    if (text.length < previousTextRef.current.length) {
      setDisplayedText(text);
      previousTextRef.current = text;
      return;
    }

    // If we have new content to display
    if (text !== previousTextRef.current && text.length > displayedText.length) {
      // Animate character by character from current position
      let currentIndex = displayedText.length;
      
      const animateNext = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(animateNext, speed);
        }
      };
      
      // Start animation after a tiny delay for smoothness
      timeoutRef.current = setTimeout(animateNext, 10);
    }

    previousTextRef.current = text;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, displayedText.length]);

  return (
    <span className="streaming-text">
      {renderMarkdown ? (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
        </div>
      ) : (
        displayedText
      )}
    </span>
  );
}