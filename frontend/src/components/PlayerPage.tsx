import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { MarkInputDialog } from './MarkInputDialog';
import { TranscriptSkeleton } from './Skeleton';
import {
  getContent,
  createMark,
  updatePlaybackState,
  getPlaybackState,
  formatDuration,
  type Content,
} from '../services/api';

export function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [currentMarkId, setCurrentMarkId] = useState<number | null>(null);
  const [creatingMark, setCreatingMark] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Read initial time from URL params
  const initialTime = parseInt(searchParams.get('t') || '0', 10);

  // Load content
  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getContent(parseInt(id));
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Set initial time and scroll to corresponding transcript position
  useEffect(() => {
    if (content && audioRef.current && initialTime > 0) {
      audioRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
    }
  }, [content, initialTime]);

  // Scroll transcript when currentTime changes
  useEffect(() => {
    if (!content?.transcript || !transcriptRef.current) return;

    const currentMs = currentTime * 1000;
    const index = content.transcript.findIndex(
      (s) => s.start <= currentMs && currentMs <= s.end
    );

    if (index >= 0) {
      const sentences = transcriptRef.current.querySelectorAll('[data-sentence]');
      if (sentences[index]) {
        sentences[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [content, Math.floor(currentTime / 5)]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [content]);

  // Periodically update playback state to backend and check for pause/resume signal
  useEffect(() => {
    if (!content) return;

    const interval = setInterval(async () => {
      // 播放时同步状态
      if (isPlayingRef.current && content) {
        await updatePlaybackState(content.id, currentTimeRef.current);
      }

      // 始终检查是否需要暂停或续播（Siri 标记触发）
      try {
        const state = await getPlaybackState();
        console.log('Playback state:', state);

        if (state.should_pause && audioRef.current) {
          console.log('Pausing audio...');
          audioRef.current.pause();
          setIsPlaying(false);
          toast('正在标记...', { duration: 2000 });
        }

        if (state.should_resume && audioRef.current) {
          console.log('Resuming audio from', state.resume_from);
          audioRef.current.currentTime = state.resume_from;
          setCurrentTime(state.resume_from);
          audioRef.current.play();
          setIsPlaying(true);
          toast.success('标记完成，继续播放');
        }
      } catch (err) {
        console.error('Error checking playback state:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [content]);

  // Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Progress bar seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseInt(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Skip forward/backward
  const handleSkip = useCallback((seconds: number) => {
    if (!audioRef.current || !content) return;
    const newTime = Math.max(0, Math.min(content.duration || 0, currentTime + seconds));
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  }, [content, currentTime]);

  // Media Session API for lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !content) return;

    // Set media metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: content.title,
      artist: content.source_name || 'EchoMark',
      album: 'EchoMark',
      artwork: [
        { src: content.cover_url || '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      handleSkip(-15);
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      handleSkip(15);
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
  }, [content, handleSkip]);

  // Create mark
  const handleMark = async () => {
    if (!content || creatingMark) return;

    setCreatingMark(true);
    try {
      await updatePlaybackState(content.id, currentTime);
      const mark = await createMark(content.id, currentTime);
      setCurrentMarkId(mark.id);
      setShowMarkDialog(true);
    } catch (err) {
      console.error('创建标记失败:', err);
      toast.error('标记失败，请重试');
    } finally {
      setCreatingMark(false);
    }
  };

  // View marks
  const handleViewMarks = () => {
    if (content) {
      navigate(`/?podcast=${encodeURIComponent(content.source_name || '')}`);
    }
  };

  // Get current sentence index
  const getCurrentSentenceIndex = () => {
    if (!content?.transcript) return -1;
    const currentMs = currentTime * 1000;
    return content.transcript.findIndex(
      (s) => s.start <= currentMs && currentMs <= s.end
    );
  };

  // Click sentence to seek
  const handleSentenceClick = (sentence: { start: number; end: number; text: string }) => {
    const timeInSeconds = sentence.start / 1000;
    setCurrentTime(timeInSeconds);
    if (audioRef.current) {
      audioRef.current.currentTime = timeInSeconds;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col pb-32">
        {/* Header skeleton */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 mx-2 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Transcript skeleton */}
        <div className="flex-1 overflow-auto px-4 py-6">
          <TranscriptSkeleton />
        </div>

        {/* Player controls skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6">
          <div className="mb-4">
            <div className="w-full h-1 bg-gray-200 rounded animate-pulse" />
            <div className="flex justify-between mt-1">
              <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">{error || '内容不存在'}</div>
      </div>
    );
  }

  const currentSentenceIndex = getCurrentSentenceIndex();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={content.media_url || ''} preload="metadata" />

      {/* Header - Fixed Top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 10,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontSize: '14px', fontWeight: 500, flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{content.title}</h1>
        <button
          onClick={handleViewMarks}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <FileText className="w-5 h-5" />
        </button>
      </div>

      {/* Transcript Area - with top padding for fixed header */}
      <div ref={transcriptRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', marginTop: '60px', marginBottom: '140px' }}>
        {content.transcript && content.transcript.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-4 text-base leading-relaxed">
            {content.transcript.map((sentence, index) => (
              <p
                key={index}
                data-sentence={index}
                onClick={() => handleSentenceClick(sentence)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: index === currentSentenceIndex ? '#fef9c3' : 'transparent',
                  color: index === currentSentenceIndex ? '#111827' : '#4b5563'
                }}
              >
                {sentence.text}
              </p>
            ))}
          </div>
        ) : content.transcript_status === 'completed' ? (
          <div className="text-center text-gray-400 py-20">暂无文稿</div>
        ) : content.transcript_status === 'processing' || content.transcript_status === 'pending' ? (
          <div className="text-center text-gray-400 py-20">文稿转录中...</div>
        ) : (
          <div className="text-center text-gray-400 py-20">
            <p>文稿转录失败</p>
            <p className="text-sm mt-2">您仍可以播放音频并创建标记</p>
          </div>
        )}
      </div>

      {/* Floating Mark Button */}
      <button
        onClick={handleMark}
        disabled={creatingMark}
        className="fixed right-6 w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center font-medium text-sm z-10"
        style={{
          bottom: '144px',
          backgroundColor: '#059669',
          color: 'white',
        }}
      >
        {creatingMark ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          'MARK'
        )}
      </button>

      {/* Player Controls - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div style={{ position: 'relative', width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
            {/* Played portion */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${content.duration ? (currentTime / content.duration) * 100 : 0}%`,
                backgroundColor: '#059669',
                borderRadius: '4px'
              }}
            />
            {/* Thumb */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${content.duration ? (currentTime / content.duration) * 100 : 0}%`,
                width: '12px',
                height: '12px',
                backgroundColor: '#059669',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            />
            {/* Invisible range input for interaction */}
            <input
              type="range"
              min="0"
              max={content.duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{
                position: 'absolute',
                top: '-6px',
                left: 0,
                width: '100%',
                height: '16px',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(content.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
          <button
            onClick={() => handleSkip(-15)}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <SkipBack style={{ width: '28px', height: '28px' }} />
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPlaying ? <Pause style={{ width: '24px', height: '24px' }} /> : <Play style={{ width: '24px', height: '24px', marginLeft: '2px' }} />}
          </button>

          <button
            onClick={() => handleSkip(15)}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <SkipForward style={{ width: '28px', height: '28px' }} />
          </button>
        </div>
      </div>

      {/* Mark Input Dialog */}
      {showMarkDialog && currentMarkId !== null && (
        <MarkInputDialog
          markId={currentMarkId}
          timestamp={formatDuration(currentTime)}
          onClose={() => {
            setShowMarkDialog(false);
            setCurrentMarkId(null);
          }}
        />
      )}
    </div>
  );
}
