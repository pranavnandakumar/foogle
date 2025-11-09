import React from 'react';
import { HomeIcon, UploadIcon, HeartIcon, UserIcon, LogoutIcon } from './Icons';

export type NavigationTab = 'feed' | 'upload' | 'favorites';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  favoriteCount?: number;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  favoriteCount = 0,
  user,
  onLogin,
  onLogout
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom shadow-lg h-16">
      <div className="flex items-center h-full">
        {/* Feed Tab (Home) */}
        <button
          onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'feed'
              ? 'bg-teal-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded flex items-center justify-center ${
            activeTab === 'feed' ? 'bg-teal-600' : 'bg-transparent'
          }`}>
            <HomeIcon className={`w-5 h-5 ${activeTab === 'feed' ? 'text-white' : 'text-teal-500'}`} />
          </div>
          <span className={`text-xs mt-0.5 ${activeTab === 'feed' ? 'text-white' : 'text-gray-600'}`}>Home</span>
        </button>

        {/* Upload Tab */}
        <button
          onClick={() => onTabChange('upload')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeTab === 'upload'
              ? 'bg-teal-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded flex items-center justify-center ${
            activeTab === 'upload' ? 'bg-teal-600' : 'bg-transparent'
          }`}>
            <UploadIcon className={`w-5 h-5 ${activeTab === 'upload' ? 'text-white' : 'text-teal-500'}`} />
          </div>
          <span className={`text-xs mt-0.5 ${activeTab === 'upload' ? 'text-white' : 'text-gray-600'}`}>Upload</span>
        </button>

        {/* Favorites Tab */}
        <button
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            activeTab === 'favorites'
              ? 'bg-pink-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded flex items-center justify-center relative ${
            activeTab === 'favorites' ? 'bg-pink-600' : 'bg-transparent'
          }`}>
            <HeartIcon className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-white' : 'text-red-500'}`} />
            {favoriteCount > 0 && activeTab !== 'favorites' && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {favoriteCount > 9 ? '9+' : favoriteCount}
              </span>
            )}
          </div>
          <span className={`text-xs mt-0.5 ${activeTab === 'favorites' ? 'text-white' : 'text-gray-600'}`}>Favorites</span>
        </button>

        {/* Login/Logout Button - Smaller, on the right */}
        <div className="flex items-center justify-center px-2 h-full border-l border-gray-200">
          {user ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="Sign Out"
            >
              <LogoutIcon className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="Sign In"
            >
              <UserIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

