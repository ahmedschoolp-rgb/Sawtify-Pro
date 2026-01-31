
import React from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl">
          <button className="px-3 sm:px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-sm">
            Player
          </button>
          <button className="px-3 sm:px-4 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 text-xs sm:text-sm font-medium transition-all">
            History
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-[10px] font-black text-white leading-none uppercase tracking-widest">Studio Mode</p>
          <p className="text-[9px] text-green-500 font-bold uppercase tracking-[0.2em] mt-1">High Fidelity</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] sm:text-xs font-black text-blue-400 shadow-inner">
          AM
        </div>
      </div>
    </header>
  );
};

export default Header;
