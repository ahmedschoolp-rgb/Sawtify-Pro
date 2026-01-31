
import React from 'react';
import { MediaFile } from '../types';

interface SidebarProps {
  files: MediaFile[];
  activeFile: MediaFile | null;
  onSelectFile: (file: MediaFile) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ files, activeFile, onSelectFile, onUpload, onRemove, isOpen }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-4 sm:p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">S</span>
            Sawtify Pro
          </h1>
        </div>
        
        <label className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-semibold text-sm">Add Media</span>
          <input type="file" multiple accept="audio/*,video/*" className="hidden" onChange={onUpload} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Playlist</h3>
        {files.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-slate-500 italic flex flex-col items-center gap-2">
            <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Empty playlist
          </div>
        ) : (
          files.map(file => (
            <div 
              key={file.id}
              onClick={() => onSelectFile(file)}
              className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                activeFile?.id === file.id ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activeFile?.id === file.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {file.type === 'video' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.13a4.5 4.5 0 102 3.133V5.703l8-1.6v6.027a4.5 4.5 0 102 3.133V3z" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${activeFile?.id === file.id ? 'text-white' : 'text-slate-300'}`}>
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">{formatSize(file.size)}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                className="lg:opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/50">
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Ready for Analysis</span>
          </div>
        </div>

        <div className="px-1 pt-2 border-t border-slate-800/50">
          <div className="flex flex-col items-center text-center">
            <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.2em] mb-2">Architected By</p>
            <p className="text-xs font-black text-slate-200 mb-1.5">أحمد مجدي</p>
            <a 
              href="https://wa.me/201140440601" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600/5 hover:bg-green-600/10 border border-green-600/20 transition-all active:scale-95 w-full justify-center"
            >
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.139c1.52.907 3.385 1.385 5.281 1.386 5.425 0 9.839-4.413 9.842-9.838.001-2.627-1.023-5.1-2.885-6.963-1.862-1.861-4.334-2.886-6.961-2.886-5.424 0-9.837 4.412-9.84 9.838-.001 1.838.513 3.635 1.488 5.188l-.98 3.58 3.676-.965zm11.332-6.19c-.313-.156-1.851-.913-2.138-1.018-.287-.104-.497-.156-.706.156-.21.312-.811 1.018-.993 1.226-.182.208-.364.234-.677.078-.313-.156-1.322-.487-2.518-1.554-.93-.83-1.557-1.854-1.739-2.166-.182-.312-.019-.481.137-.636.14-.14.313-.365.47-.547.156-.182.208-.312.313-.52.104-.208.052-.39-.026-.547-.078-.156-.706-1.703-.967-2.331-.254-.611-.513-.529-.706-.539-.182-.01-.39-.012-.599-.012-.208 0-.547.078-.833.39-.287.312-1.096 1.069-1.096 2.607 0 1.538 1.121 3.024 1.277 3.232.156.208 2.206 3.368 5.343 4.723.746.322 1.328.514 1.782.658.75.238 1.433.205 1.973.124.602-.09 1.851-.756 2.112-1.486.261-.73.261-1.356.183-1.486-.078-.13-.287-.208-.6-.364z"/>
              </svg>
              <span className="text-[10px] font-black text-green-500 tracking-wider">01140440601</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
