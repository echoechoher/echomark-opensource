import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Sparkles } from 'lucide-react';
import { MarkCard } from './MarkCard';
import { MarkCardSkeleton } from './Skeleton';
import { getMarks, deleteMark, formatRecordTime, formatTimestamp, type Mark } from '../services/api';

export function MarksLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const podcastFilter = searchParams.get('podcast') || '';

  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(podcastFilter || '全部');

  // Extract unique podcast names
  const podcastNames = Array.from(new Set(marks.map(m => m.content_source_name).filter(Boolean))) as string[];
  const filters = ['全部', ...podcastNames];

  // Filter marks based on active filter
  const filteredMarks = activeFilter === '全部'
    ? marks
    : marks.filter(m => m.content_source_name === activeFilter);

  const loadMarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMarks();
      setMarks(data.items);

      if (podcastFilter) {
        setActiveFilter(podcastFilter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarks();
  }, []);

  useEffect(() => {
    if (podcastFilter) {
      setActiveFilter(podcastFilter);
    }
  }, [podcastFilter]);

  const handleTimestampClick = (mark: Mark) => {
    navigate(`/player/${mark.content_id}?t=${mark.timestamp}`);
  };

  const handleDeleteMark = async (markId: number) => {
    if (!confirm('确定要删除这个标记吗？')) return;
    try {
      await deleteMark(markId);
      loadMarks();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'linear-gradient(to bottom right, #34d399, #14b8a6)' }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'white' }} />
            <h1 className="text-xl font-light text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>Marks</h1>
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
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Marks List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <>
            <MarkCardSkeleton />
            <MarkCardSkeleton />
            <MarkCardSkeleton />
            <MarkCardSkeleton />
          </>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-red-500">{error}</div>
          </div>
        ) : filteredMarks.length > 0 ? (
          filteredMarks.map((mark) => (
            <MarkCard
              key={mark.id}
              mark={{
                id: mark.id.toString(),
                recordTime: formatRecordTime(mark.created_at),
                timestamp: formatTimestamp(mark.timestamp),
                timestampSeconds: mark.timestamp || 0,
                contextBefore: mark.context_before || '',
                contextCurrent: mark.context_current || '',
                contextAfter: mark.context_after || '',
                thought: mark.thought || '',
                podcastName: mark.content_source_name || '',
                episodeName: mark.content_title || '',
                episodeId: mark.content_id.toString(),
              }}
              onClick={() => navigate(`/mark/${mark.id}`)}
              onTimestampClick={() => handleTimestampClick(mark)}
              onDelete={() => handleDeleteMark(mark.id)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>暂无标记</p>
          </div>
        )}
      </div>
    </div>
  );
}
