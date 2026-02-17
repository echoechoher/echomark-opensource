import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Library } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { EpisodeCard } from './EpisodeCard';
import { ImportDialog } from './ImportDialog';
import { EpisodeCardSkeleton } from './Skeleton';
import { getContents, deleteContent, cancelTranscription, getTranscriptStatus, type Content } from '../services/api';

export function ContentLibrary() {
  const navigate = useNavigate();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContents();
      setContents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // 轮询检查转录状态
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const contentsRef = useRef<Content[]>([]);

  // 保持 contents 的最新引用
  useEffect(() => {
    contentsRef.current = contents;
  }, [contents]);

  useEffect(() => {
    // 找出正在转录的内容
    const hasProcessing = contents.some(
      c => c.transcript_status === 'processing' || c.transcript_status === 'pending'
    );

    // 如果没有正在转录的内容，清除轮询
    if (!hasProcessing) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // 如果已经有轮询在运行，不重复创建
    if (pollingRef.current) {
      return;
    }

    // 设置轮询，每 3 秒检查一次
    pollingRef.current = setInterval(async () => {
      const currentContents = contentsRef.current;
      const processingContents = currentContents.filter(
        c => c.transcript_status === 'processing' || c.transcript_status === 'pending'
      );

      if (processingContents.length === 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      let hasUpdate = false;

      for (const content of processingContents) {
        try {
          const status = await getTranscriptStatus(content.id);
          if (status.status !== content.transcript_status) {
            hasUpdate = true;
            break;
          }
        } catch (err) {
          console.error('检查转录状态失败:', err);
        }
      }

      // 如果有状态变化，重新加载列表
      if (hasUpdate) {
        const data = await getContents();
        setContents(data.items);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contents.length]);

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    loadContents();
  };

  const handleDelete = async (contentId: number) => {
    if (!confirm('确定要删除这个内容吗？相关的标记也会被删除。')) return;
    setDeletingId(contentId);
    try {
      await deleteContent(contentId);
      // 直接从本地状态移除，无需刷新
      setContents(prev => prev.filter(c => c.id !== contentId));
      toast.success('已删除');
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelTranscription = async (contentId: number) => {
    if (!confirm('确定要终止转录吗？')) return;
    try {
      await cancelTranscription(contentId);
      // 更新本地状态
      setContents(prev => prev.map(c =>
        c.id === contentId ? { ...c, transcript_status: 'cancelled' as const } : c
      ));
      toast.success('已终止转录');
    } catch (err) {
      console.error('终止转录失败:', err);
      toast.error('终止转录失败');
    }
  };

  // Extract unique podcast names
  const podcastNames = Array.from(new Set(contents.map(c => c.source_name).filter(Boolean))) as string[];
  const filters = ['全部', ...podcastNames];

  // Filter contents based on active filter
  const filteredContents = activeFilter === '全部'
    ? contents
    : contents.filter(c => c.source_name === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'linear-gradient(to bottom right, #60a5fa, #a78bfa)' }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5" style={{ color: 'white' }} />
              <h1 className="text-xl font-light text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>Library</h1>
            </div>
            <button
              onClick={() => setShowImportDialog(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tags */}
      {filters.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto sticky top-[60px] z-10">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-gray-200">
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500">{error}</div>
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-gray-400 mb-4">还没有内容</div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            导入播客
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredContents.map((content) => (
            <EpisodeCard
              key={content.id}
              episode={{
                id: content.id.toString(),
                title: content.title,
                podcastName: content.source_name || '',
                duration: content.duration
                  ? `${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}`
                  : '',
                durationSeconds: content.duration || 0,
                coverUrl: content.cover_url || '',
                marksCount: content.marks_count,
                transcribing: content.transcript_status === 'processing' || content.transcript_status === 'pending',
                transcriptStatus: content.transcript_status,
              }}
              deleting={deletingId === content.id}
              onClick={() => navigate(`/player/${content.id}`)}
              onDelete={() => handleDelete(content.id)}
              onCancelTranscription={() => handleCancelTranscription(content.id)}
            />
          ))}
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
