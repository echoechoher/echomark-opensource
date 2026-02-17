import { useState } from 'react';
import { X } from 'lucide-react';
import { importContent } from '../services/api';

interface ImportDialogProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportDialog({ onClose, onSuccess }: ImportDialogProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await importContent(url.trim());
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">添加播客</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴播客链接"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        {/* Hint */}
        <p className="text-xs text-gray-400 mt-2">
          支持小宇宙链接
        </p>

        {/* Button */}
        <button
          onClick={handleImport}
          disabled={!url.trim() || loading}
          className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '导入中...' : '导入'}
        </button>
      </div>
    </div>
  );
}
