import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { updateMark } from '../services/api';

interface MarkInputDialogProps {
  markId: number;
  timestamp: string;
  onClose: () => void;
}

export function MarkInputDialog({ markId, timestamp, onClose }: MarkInputDialogProps) {
  const [thought, setThought] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (thought.trim()) {
        await updateMark(markId, thought.trim());
      }
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败，请重试');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-lg font-medium">已保存</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-sm text-gray-600">已标记 @ {timestamp}</span>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            添加想法 (可选)
          </label>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="输入你的想法..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            跳过
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
