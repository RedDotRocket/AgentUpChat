import SmoothStreamingText from './SmoothStreamingText';
import Image from 'next/image';

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
}

export default function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 mt-1">
            <Image src="/mascot_one.png" alt="Assistant" width={40} height={40} className="rounded-full shadow-sm" />
          </div>
          <div className="max-w-[70%]">
            <div className="rounded-2xl px-4 py-3 shadow-sm bg-white border border-gray-200">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <SmoothStreamingText text={content} speed={20} renderMarkdown={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}