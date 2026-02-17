import { Outlet, useLocation, useNavigate } from 'react-router';
import { BookMarked, Library, Settings } from 'lucide-react';

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  const isMarksActive = location.pathname === '/';
  const isContentActive = location.pathname.startsWith('/content');
  const isSettingsActive = location.pathname.startsWith('/settings');

  // Hide tab bar on player and detail pages
  const hideTabBar = location.pathname.startsWith('/player') || location.pathname.startsWith('/mark');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="flex-1 overflow-auto pb-20">
        <Outlet />
      </div>

      {!hideTabBar && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => navigate('/')}
              className={`flex-1 flex flex-col items-center py-3 ${
                isMarksActive ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <BookMarked className="w-6 h-6" />
              <span className="text-xs mt-1">标记</span>
            </button>
            <button
              onClick={() => navigate('/content')}
              className={`flex-1 flex flex-col items-center py-3 ${
                isContentActive ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <Library className="w-6 h-6" />
              <span className="text-xs mt-1">内容库</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`flex-1 flex flex-col items-center py-3 ${
                isSettingsActive ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs mt-1">设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
