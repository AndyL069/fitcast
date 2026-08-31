import React, { useState } from 'react';
import { Sparkles, Shirt, Calendar, CloudSun, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'today' | 'closet' | 'history';
  setActiveTab: (tab: 'today' | 'closet' | 'history') => void;
  onOpenUpload: () => void;
  onOpenAuth: () => void;
  itemsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenAuth,
  itemsCount
}) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('today')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Clueless
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              KI-Stylist
            </span>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'today'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CloudSun className="w-4 h-4" />
            <span className="hidden sm:inline">Heutiges Outfit</span>
          </button>

          <button
            onClick={() => setActiveTab('closet')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'closet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span className="hidden sm:inline">Kleiderschrank</span>
            {itemsCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {itemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Verlauf</span>
          </button>
        </nav>

        {/* Right Section: Add Item & User Profile */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-blue-600/25 transition-all duration-200"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden md:inline">Kleidung hinzufügen</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {getInitials(user.username)}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                  {user.username}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.username}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Abmelden</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-200 transition-colors active:scale-95"
            >
              <LogIn className="w-4 h-4 text-slate-600" />
              <span>Anmelden</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
