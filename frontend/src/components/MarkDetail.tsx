import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Bookmark, Play, Radio, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { MarkDetailSkeleton } from './Skeleton';
import { getMark, updateMark, formatTimestamp, type Mark } from '../services/api';

export function MarkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mark, setMark] = useState<Mark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingThought, setIsEditingThought] = useState(false);
  const [thought, setThought] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getMark(parseInt(id));
        setMark(data);
        setThought(data.thought || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSaveThought = async () => {
    if (!mark) return;
    setSaving(true);
    try {
      const updated = await updateMark(mark.id, thought);
      setMark(updated);
      setIsEditingThought(false);
      toast.success('保存成功');
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayFromMark = () => {
    if (mark) {
      navigate(`/player/${mark.content_id}?t=${mark.timestamp}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <MarkDetailSkeleton />
      </div>
    );
  }

  if (error || !mark) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error || '标记不存在'}</div>
      </div>
    );
  }

  // Check if there's any context
  const hasContext = mark.context_before || mark.context_current || mark.context_after;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">标记详情</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Time Badge - clickable to jump to playback */}
        <div className="flex items-center">
          <button
            onClick={handlePlayFromMark}
            className="px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#d1fae5', color: '#047857' }}
          >
            <Bookmark className="w-4 h-4" />
            <span className="font-mono text-sm">{formatTimestamp(mark.timestamp)}</span>
          </button>
        </div>

        {/* Context with highlight */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            📝 上下文原文
          </h2>
          {hasContext ? (
            <div className="text-base leading-relaxed">
              <span className="text-gray-500">{mark.context_before}</span>
              <span className="bg-yellow-100 text-gray-900 px-1 py-0.5 rounded">{mark.context_current}</span>
              <span className="text-gray-500">{mark.context_after}</span>
            </div>
          ) : (
            <p className="text-gray-400">暂无上下文（文稿可能还在转录中）</p>
          )}
        </div>

        {/* Thought */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
              💭 我的想法
            </h2>
            <button
              onClick={() => setIsEditingThought(!isEditingThought)}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
          </div>

          {isEditingThought ? (
            <div>
              <textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setThought(mark.thought || '');
                    setIsEditingThought(false);
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveThought}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-base text-gray-700 leading-relaxed italic">
              {thought || <span className="text-gray-400">暂无想法</span>}
            </p>
          )}
        </div>

        {/* Source and Play Button */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            📍 来源
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Radio className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{mark.content_source_name}</div>
                <div className="text-sm text-gray-600 mt-0.5">{mark.content_title}</div>
              </div>
            </div>
            <button
              onClick={handlePlayFromMark}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 transition-colors flex-shrink-0 shadow-md"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
