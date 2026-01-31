
import React from 'react';
import { PlayerSettings } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (amount: number) => void;
  settings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  isPlaying, 
  onTogglePlay, 
  onSeek, 
  settings, 
  onUpdateSettings,
  isRecording = false,
  onToggleRecording
}) => {
  const speedPresets = [1.0, 1.25, 1.5, 2.0, 2.5];

  const adjustSpeed = (delta: number) => {
    const newRate = Math.min(4, Math.max(0.5, settings.playbackRate + delta));
    onUpdateSettings({ playbackRate: parseFloat(newRate.toFixed(2)) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
        
        {/* Playback Navigation & Volume */}
        <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onSeek(-settings.seekAmount)}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all active:scale-90 border border-slate-700/50"
              title={`Backward ${settings.seekAmount}s`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
            </button>
            
            <button 
              onClick={onTogglePlay}
              className="w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-blue-600/40 active:scale-95 border-4 border-blue-400/20"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>

            <button 
              onClick={() => onSeek(settings.seekAmount)}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all active:scale-90 border border-slate-700/50"
              title={`Forward ${settings.seekAmount}s`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 w-full sm:w-auto">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={settings.volume} 
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })} 
              className="w-full sm:w-24 accent-blue-500 h-1.5 rounded-lg appearance-none bg-slate-700 cursor-pointer" 
            />
          </div>
        </div>

        {/* Speed Controller */}
        <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-3xl border border-blue-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">Speed Controller</span>
            <span className="text-xl font-black text-white font-mono bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-500/30">
              {settings.playbackRate.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => adjustSpeed(-0.1)} className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all active:scale-90">-0.1</button>
            <div className="flex-1 px-2">
              <input type="range" min="0.5" max="3" step="0.05" value={settings.playbackRate} onChange={(e) => onUpdateSettings({ playbackRate: parseFloat(e.target.value) })} className="w-full accent-blue-400 h-2 rounded-lg appearance-none bg-slate-800 cursor-pointer" />
            </div>
            <button onClick={() => adjustSpeed(0.1)} className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all active:scale-90">+0.1</button>
          </div>

          <div className="flex items-center justify-between gap-1 mt-1">
            {speedPresets.map(rate => (
              <button key={rate} onClick={() => onUpdateSettings({ playbackRate: rate })} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${settings.playbackRate === rate ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-transparent hover:border-slate-600'}`}>
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Screen Record Button */}
        <button 
          onClick={onToggleRecording} 
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isRecording ? 'bg-red-600/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold">{isRecording ? 'Stop Rec' : 'Screen Rec'}</p>
              <p className="text-[10px] opacity-70">Capture HD + Audio</p>
            </div>
          </div>
          {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
        </button>

        {/* Skip Silence */}
        <button onClick={() => onUpdateSettings({ skipSilence: !settings.skipSilence })} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.skipSilence ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.skipSilence ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></div>
            <div className="text-left"><p className="text-xs font-bold">Skip Silence</p><p className="text-[10px] opacity-70">Auto fast-forward</p></div>
          </div>
        </button>

        {/* Noise Filter */}
        <button onClick={() => onUpdateSettings({ noiseReduction: !settings.noiseReduction })} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.noiseReduction ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.noiseReduction ? 'bg-emerald-600 text-white' : 'bg-slate-700'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg></div>
            <div className="text-left"><p className="text-xs font-bold">Noise Filter</p><p className="text-[10px] opacity-70">Speech isolation</p></div>
          </div>
        </button>

        {/* Plate Mode */}
        <button onClick={() => onUpdateSettings({ speechClarity: !settings.speechClarity })} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.speechClarity ? 'bg-orange-600/10 border-orange-500/50 text-orange-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.speechClarity ? 'bg-orange-600 text-white' : 'bg-slate-700'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
            <div className="text-left"><p className="text-xs font-bold">Plate Mode</p><p className="text-[10px] opacity-70">Better clarity</p></div>
          </div>
        </button>

        {/* Seek Step */}
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-400 group">
          <div className="p-2 bg-slate-700 rounded-lg text-slate-300 group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">Seek Step</p>
            <div className="flex items-center gap-1">
              <input type="number" value={settings.seekAmount} onChange={(e) => onUpdateSettings({ seekAmount: Math.max(1, parseInt(e.target.value) || 1) })} className="w-10 bg-transparent text-xs text-white focus:outline-none font-bold" />
              <span className="text-[10px] uppercase opacity-50 font-bold">Sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
