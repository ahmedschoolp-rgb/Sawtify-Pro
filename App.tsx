
import React, { useState, useEffect } from 'react';
import { MediaFile, PlayerSettings } from './types';
import Sidebar from './components/Sidebar';
import PlayerContainer from './components/PlayerContainer';
import Header from './components/Header';

const App: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [settings, setSettings] = useState<PlayerSettings>({
    playbackRate: 1.0,
    skipSilence: false,
    noiseReduction: false,
    speechClarity: true,
    seekAmount: 3,
    volume: 0.8
  });

  const processFiles = (incomingFiles: FileList | File[]) => {
    const newFiles: MediaFile[] = Array.from(incomingFiles).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'audio',
      size: file.size
    }));

    setFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setActiveFile(newFiles[0]);
    }
  };

  useEffect(() => {
    // 1. التعامل مع الـ Launch Queue (فتح الملفات مباشرة)
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (launchParams.files && launchParams.files.length > 0) {
          const pickedFiles = [];
          for (const handle of launchParams.files) {
            pickedFiles.push(await handle.getFile());
          }
          processFiles(pickedFiles);
        }
      });
    }

    // 2. التعامل مع الرسائل من الـ Service Worker (WhatsApp Share)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHARED_FILES') {
        processFiles(event.data.files);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) processFiles(event.target.files);
  };

  const updateSettings = (newSettings: Partial<PlayerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFile?.id === id) {
        setActiveFile(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-955 text-slate-200 overflow-hidden relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        files={files} 
        activeFile={activeFile} 
        onSelectFile={(file) => {
          setActiveFile(file);
          setIsSidebarOpen(false);
        }} 
        onUpload={handleFileUpload}
        onRemove={removeFile}
        isOpen={isSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 relative overflow-y-auto lg:overflow-hidden bg-slate-900/30 flex flex-col items-center p-2 sm:p-4 lg:p-8">
          {activeFile ? (
            <PlayerContainer 
              file={activeFile} 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Sawtify Pro</h2>
              <p className="text-slate-400 max-w-sm text-sm sm:text-base">Upload files or share directly from WhatsApp to start.</p>
              <label className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                Select Audio/Video
                <input type="file" multiple accept="audio/*,video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
