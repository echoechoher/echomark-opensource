import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, XCircle } from 'lucide-react';

interface DropdownMenuProps {
  onDelete: () => void;
  onCancelTranscription?: () => void;
  showCancelTranscription?: boolean;
}

export function DropdownMenu({ onDelete, onCancelTranscription, showCancelTranscription }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete();
  };

  const handleCancelTranscription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onCancelTranscription?.();
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50"
          style={{ top: menuPosition.top, right: menuPosition.right }}
        >
          {showCancelTranscription && onCancelTranscription && (
            <button
              onClick={handleCancelTranscription}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              终止转录
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      )}
    </>
  );
}
