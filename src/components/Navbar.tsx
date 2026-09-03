import React from 'react';
import { User, LogIn, LogOut, Home } from 'lucide-react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import echoraLogo from '../assets/images/echora_logo.jpeg';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notation: NoteNotation;
  setNotation: (notation: NoteNotation) => void;
  vocalProfile: VocalRangeProfile | null;
  practiceStreak: number;
  totalMinutes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  notation,
  setNotation,
  vocalProfile,
  practiceStreak,
  totalMinutes,
}) => {
  const { t } = useLanguage();

  const AccountNavButton: React.FC = () => {
    const { user, openAuthModal, logout } = useAuth();

    if (user) {
      const firstNameOnly = user.firstName || user.name.split(' ')[0] || user.name;
      return (
        <div
          className={`flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl transition-all border ${
            activeTab === 'profile'
              ? 'bg-sky-500 text-slate-950 font-black border-sky-400 shadow-md shadow-sky-500/30'
              : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 cursor-pointer font-extrabold text-xs"
            title="Apri Profilo"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={firstNameOnly} className="w-full h-full object-cover" />
              ) : (
                firstNameOnly.charAt(0).toUpperCase()
              )}
            </div>
            <span className="truncate max-w-[110px]">{firstNameOnly}</span>
          </button>

          <div className={`w-px h-3.5 ${activeTab === 'profile' ? 'bg-slate-950/30' : 'bg-slate-700'} mx-0.5`} />

          <button
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-slate-950/70 hover:text-slate-950 hover:bg-slate-950/10'
                : 'text-slate-400 hover:text-red-400 hover:bg-slate-900/60'
            }`}
            title="Esci dall'account"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => openAuthModal('signup')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0"
      >
        <User className="w-3.5 h-3.5" />
        <span>Crea Account / Accedi</span>
      </button>
    );
  };

  const navItems = [
    { id: 'start', label: t('navStart') },
    { id: 'exercises', label: t('navWarmup') },
    { id: 'workout', label: t('navWorkout') },
    { id: 'cooldown', label: t('navCooldown') },
    { id: 'about', label: t('navAbout') },
    { id: 'pricing', label: t('navPricing') },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer group shrink-0" onClick={() => setActiveTab('start')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-lg shadow-sky-500/30 border-2 border-sky-400/70 group-hover:scale-105 transition-transform bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src={echoraLogo}
                alt="Echora Logo"
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 
                className="text-xl tracking-wide drop-shadow-sm leading-none"
                style={{
                  fontFamily: "'Amita', cursive, serif",
                  fontStyle: 'normal',
                  fontWeight: 'bold',
                  fontSize: '32px',
                  borderColor: '#75d5ff',
                  textDecorationLine: 'none',
                  color: '#5cfeec',
                }}
              >
                Echora
              </h1>
              <p 
                className="text-[8px] sm:text-[9px] text-sky-300 uppercase tracking-widest mt-0.5"
                style={{
                  fontFamily: 'Verdana, sans-serif',
                  fontWeight: 'bold',
                }}
              >
                {t('subTitle')}
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isStartTab = item.id === 'start';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md shadow-sky-500/30 border border-sky-400/50 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {isStartTab ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <span>{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Notation Toggle */}
            <button
              onClick={() => setNotation(notation === 'latin' ? 'scientific' : 'latin')}
              className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-bold hover:text-white hover:border-indigo-500 transition-colors cursor-pointer"
              title="Cambia notazione tra DO e C"
            >
              <span>{notation === 'latin' ? 'DO' : 'C'}</span>
            </button>

            {/* Account Button */}
            <AccountNavButton />
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex overflow-x-auto py-1.5 space-x-1 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isStartTab = item.id === 'start';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap transition-colors shrink-0 flex items-center justify-center ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm border border-sky-400/50'
                    : 'text-slate-300 bg-slate-800/60 hover:bg-slate-800'
                }`}
              >
                {isStartTab ? (
                  <Home className="w-4 h-4" />
                ) : (
                  <span>{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

