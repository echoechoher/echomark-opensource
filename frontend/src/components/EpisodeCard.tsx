import { Loader2, XCircle, AlertCircle } from 'lucide-react';
import type { Episode } from '../data/mockData';
import { DropdownMenu } from './DropdownMenu';

interface EpisodeCardProps {
  episode: Episode;
  deleting?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onCancelTranscription?: () => void;
}

export function EpisodeCard({ episode, deleting, onClick, onDelete, onCancelTranscription }: EpisodeCardProps) {
  // 判断是否可以点击进入播放页
  const isClickable = !deleting && episode.transcriptStatus !== 'failed' && episode.transcriptStatus !== 'cancelled';

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  // 渲染状态标签
  const renderStatus = () => {
    if (deleting) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#dc2626' }}>
          <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
          <span>删除中...</span>
        </div>
      );
    }

    if (episode.transcribing) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#d97706' }}>
          <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
          <span>转录中...</span>
        </div>
      );
    }

    if (episode.transcriptStatus === 'cancelled') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
          <XCircle style={{ width: '14px', height: '14px' }} />
          <span>已停止转录</span>
        </div>
      );
    }

    if (episode.transcriptStatus === 'failed') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#dc2626' }}>
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          <span>转录失败</span>
        </div>
      );
    }

    return (
      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
        {episode.duration} · {episode.marksCount} 条标记
      </p>
    );
  };

  return (
    <div
      className="bg-white px-4 py-4 flex items-center gap-3 transition-all"
      style={{
        opacity: deleting ? 0.5 : (isClickable ? 1 : 0.7),
        cursor: isClickable ? 'default' : 'not-allowed',
        pointerEvents: deleting ? 'none' : 'auto'
      }}
    >
      {/* Cover */}
      <div
        onClick={handleClick}
        style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
      >
        <img
          src={episode.coverUrl}
          alt={episode.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          style={{ filter: isClickable ? 'none' : 'grayscale(50%)' }}
        />
      </div>

      {/* Info */}
      <div
        onClick={handleClick}
        style={{ flex: 1, minWidth: 0, cursor: isClickable ? 'pointer' : 'not-allowed' }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {episode.title}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{episode.podcastName}</p>
        {renderStatus()}
      </div>

      {/* Delete Menu */}
      {onDelete && (
        <DropdownMenu
          onDelete={onDelete}
          onCancelTranscription={onCancelTranscription}
          showCancelTranscription={episode.transcribing}
        />
      )}
    </div>
  );
}
