import { Bookmark, MessageSquare, Radio } from 'lucide-react';
import { DropdownMenu } from './DropdownMenu';

interface Mark {
  id: string;
  recordTime: string;
  timestamp: string;
  timestampSeconds: number;
  contextBefore: string;
  contextCurrent: string;
  contextAfter: string;
  thought?: string;
  podcastName: string;
  episodeName: string;
  episodeId: string;
}

interface MarkCardProps {
  mark: Mark;
  onClick?: () => void;
  onTimestampClick?: () => void;
  onDelete?: () => void;
}

export function MarkCard({ mark, onClick, onTimestampClick, onDelete }: MarkCardProps) {
  const handleTimestampClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTimestampClick?.();
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Record Time + Delete Menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Record Time */}
        <div className="text-xs text-gray-400">{mark.recordTime}</div>
        {/* Delete Menu */}
        {onDelete && <DropdownMenu onDelete={onDelete} />}
      </div>

      <div onClick={onClick} className="cursor-pointer">
        {/* Timestamp */}
        <button
          onClick={handleTimestampClick}
          className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
        >
          <Bookmark className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-mono text-emerald-600">{mark.timestamp}</span>
        </button>

        {/* Context with highlight */}
        <div className="text-sm leading-relaxed mb-3">
          <span className="text-gray-500">{mark.contextBefore}</span>
          <span className="bg-yellow-100 text-gray-900 px-0.5 rounded">{mark.contextCurrent}</span>
          <span className="text-gray-500">{mark.contextAfter}</span>
        </div>

        {/* Thought */}
        {mark.thought && (
          <div className="bg-amber-50 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 italic">{mark.thought}</p>
            </div>
          </div>
        )}

        {/* Source */}
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Radio className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">{mark.podcastName}</div>
            <div>{mark.episodeName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
