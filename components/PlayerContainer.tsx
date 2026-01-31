
import React, { useRef, useState, useEffect } from 'react';
import { MediaFile, PlayerSettings } from '../types';
import Controls from './Controls';
import Visualizer from './Visualizer';

interface PlayerContainerProps {
  file: MediaFile;
  settings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
}

const PlayerContainer: React.FC<PlayerContainerProps> = ({ file, settings, onUpdateSettings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastElementRef = useRef<HTMLVideoElement | null>(null);
  
  // Nodes
  const lowCutFilterRef = useRef<BiquadFilterNode | null>(null);
  const highCutFilterRef = useRef<BiquadFilterNode | null>(null);
  const voiceEnhancerRef = useRef<BiquadFilterNode | null>(null);
  const clarityFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null); // للتحكم في مستوى الصوت الأساسي
  const mainAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // VAD (Silence Detection)
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const isCurrentlySkippingRef = useRef<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // 1. Initial Audio Engine Setup
  useEffect(() => {
    if (!videoRef.current) return;

    // إنشاء محرك الصوت إذا لم يكن موجوداً
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'playback'
      });
    }
    const ctx = audioContextRef.current;

    // إذا تغير عنصر الفيديو (بسبب تغيير نوع الملف)، نحتاج لإعادة إنشاء المصدر
    if (lastElementRef.current !== videoRef.current) {
      if (sourceRef.current) sourceRef.current.disconnect();
      sourceRef.current = ctx.createMediaElementSource(videoRef.current);
      lastElementRef.current = videoRef.current;
    }

    // إنشاء العقد البرمجية (فقط مرة واحدة)
    if (!mainAnalyserRef.current) mainAnalyserRef.current = ctx.createAnalyser();
    if (!streamDestinationRef.current) streamDestinationRef.current = ctx.createMediaStreamDestination();
    if (!masterGainRef.current) masterGainRef.current = ctx.createGain();
    if (!lowCutFilterRef.current) {
      lowCutFilterRef.current = ctx.createBiquadFilter();
      lowCutFilterRef.current.type = 'highpass';
      lowCutFilterRef.current.frequency.value = 20;
    }
    if (!highCutFilterRef.current) {
      highCutFilterRef.current = ctx.createBiquadFilter();
      highCutFilterRef.current.type = 'lowpass';
      highCutFilterRef.current.frequency.value = 20000;
    }
    if (!voiceEnhancerRef.current) {
      voiceEnhancerRef.current = ctx.createBiquadFilter();
      voiceEnhancerRef.current.type = 'peaking';
      voiceEnhancerRef.current.frequency.value = 2000;
      voiceEnhancerRef.current.gain.value = 0;
    }
    if (!clarityFilterRef.current) {
      clarityFilterRef.current = ctx.createBiquadFilter();
      clarityFilterRef.current.type = 'peaking';
      clarityFilterRef.current.frequency.value = 3200;
      clarityFilterRef.current.gain.value = 0;
    }
    if (!compressorRef.current) {
      compressorRef.current = ctx.createDynamicsCompressor();
    }
    if (!vadAnalyserRef.current) {
      vadAnalyserRef.current = ctx.createAnalyser();
      vadAnalyserRef.current.fftSize = 1024;
    }

    // ربط الشبكة (Source -> Filters -> MasterGain -> Analyser -> Output)
    sourceRef.current.disconnect();
    sourceRef.current.connect(lowCutFilterRef.current);
    lowCutFilterRef.current.connect(highCutFilterRef.current);
    highCutFilterRef.current.connect(voiceEnhancerRef.current);
    voiceEnhancerRef.current.connect(clarityFilterRef.current);
    clarityFilterRef.current.connect(compressorRef.current);
    compressorRef.current.connect(masterGainRef.current);
    
    masterGainRef.current.connect(mainAnalyserRef.current);
    mainAnalyserRef.current.connect(ctx.destination);
    
    // ربط مخرج التسجيل والتحليل
    masterGainRef.current.connect(streamDestinationRef.current);
    sourceRef.current.connect(vadAnalyserRef.current);

  }, [file]); // يعيد التشغيل عند تغيير الملف لضمان ربط العنصر الجديد

  // 2. Volume & Audio Interaction
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(settings.volume, audioContextRef.current?.currentTime || 0, 0.05);
    }
    // تأكد أن صوت عنصر الفيديو نفسه عالٍ ليتم تمريره للمحرك
    if (videoRef.current) videoRef.current.volume = 1.0;
  }, [settings.volume]);

  // 3. Play/Pause with Context Resume
  const togglePlay = async () => {
    if (!videoRef.current || !audioContextRef.current) return;
    
    // المتصفح يمنع الصوت حتى يتم الضغط على زر في الصفحة
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  // 4. Filters Processing
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !lowCutFilterRef.current || !highCutFilterRef.current || !voiceEnhancerRef.current) return;
    
    const time = ctx.currentTime;
    if (settings.noiseReduction) {
      lowCutFilterRef.current.frequency.setTargetAtTime(320, time, 0.1);
      highCutFilterRef.current.frequency.setTargetAtTime(6000, time, 0.1);
      voiceEnhancerRef.current.gain.setTargetAtTime(7, time, 0.1);
    } else {
      lowCutFilterRef.current.frequency.setTargetAtTime(20, time, 0.1);
      highCutFilterRef.current.frequency.setTargetAtTime(20000, time, 0.1);
      voiceEnhancerRef.current.gain.setTargetAtTime(0, time, 0.1);
    }
  }, [settings.noiseReduction]);

  useEffect(() => {
    if (clarityFilterRef.current) {
      clarityFilterRef.current.gain.setTargetAtTime(settings.speechClarity ? 12 : 0, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [settings.speechClarity]);

  // 5. Silence Skipping Logic
  useEffect(() => {
    let animationId: number;
    const dataArray = new Float32Array(vadAnalyserRef.current?.frequencyBinCount || 0);
    
    const checkSilence = () => {
      if (vadAnalyserRef.current && isPlaying && settings.skipSilence && videoRef.current) {
        vadAnalyserRef.current.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sumSquares / dataArray.length);

        if (rms < 0.01) { // عتبة الصمت
          if (!silenceStartTimeRef.current) silenceStartTimeRef.current = performance.now();
          if (performance.now() - silenceStartTimeRef.current > 1500) {
            setSilenceDetected(true);
            isCurrentlySkippingRef.current = true;
            videoRef.current.playbackRate = 8.0; // تسريع 8 أضعاف عند الصمت
          }
        } else {
          silenceStartTimeRef.current = null;
          if (silenceDetected) {
            setSilenceDetected(false);
            if (isCurrentlySkippingRef.current) {
              videoRef.current.playbackRate = settings.playbackRate;
              isCurrentlySkippingRef.current = false;
            }
          }
        }
      }
      animationId = requestAnimationFrame(checkSilence);
    };
    animationId = requestAnimationFrame(checkSilence);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, settings.skipSilence, settings.playbackRate, silenceDetected]);

  // 6. Recording (Capture Screen + Processed Audio)
  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      displayStreamRef.current = displayStream;
      recordedChunksRef.current = [];

      const audioTrack = streamDestinationRef.current!.stream.getAudioTracks()[0];
      const combinedStream = new MediaStream([...displayStream.getVideoTracks(), audioTrack]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      recorder.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sawtify_Studio_${Date.now()}.webm`;
        a.click();
        displayStream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) { console.error("Rec Error:", err); }
  };

  useEffect(() => {
    let itv: any;
    if (isRecording) itv = setInterval(() => setRecordingTime(p => p + 1), 1000);
    return () => clearInterval(itv);
  }, [isRecording]);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="w-full h-full flex flex-col max-w-5xl">
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-4">
        <div className="w-full relative rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center">
          {isRecording && (
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full animate-pulse shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Capture Live: {formatTime(recordingTime)}</span>
            </div>
          )}
          {file.type === 'video' ? (
            <video 
              ref={videoRef} 
              src={file.url} 
              crossOrigin="anonymous" 
              className="w-full h-auto max-h-[60vh] object-contain" 
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} 
              onLoadedMetadata={() => {
                setDuration(videoRef.current?.duration || 0);
                if (videoRef.current) videoRef.current.playbackRate = settings.playbackRate;
              }} 
              onEnded={() => setIsPlaying(false)} 
              onClick={togglePlay} 
              playsInline
            />
          ) : (
            <div className="w-full h-80 bg-slate-900 flex flex-col items-center justify-center p-8 relative">
              <Visualizer analyser={mainAnalyserRef.current} isPlaying={isPlaying} />
              <video 
                ref={videoRef} 
                src={file.url} 
                className="hidden" 
                crossOrigin="anonymous" 
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} 
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
                onEnded={() => setIsPlaying(false)} 
              />
              <div className="mt-8 text-center max-w-full z-10">
                <p className="text-xl font-black text-white mb-2 truncate px-4">{file.name}</p>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${silenceDetected ? 'bg-yellow-500 text-black animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
                  {silenceDetected ? '⚡ Skipping Silence' : '🗣️ Speech Active'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl mb-8">
        <div className="mb-8">
          <div className="flex justify-between text-[11px] font-black text-slate-500 mb-3 uppercase tracking-widest">
            <span className="text-blue-400">{formatTime(currentTime)}</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full cursor-pointer relative overflow-hidden" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (videoRef.current) videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}>
            <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
          </div>
        </div>
        <Controls 
          isPlaying={isPlaying} 
          onTogglePlay={togglePlay} 
          onSeek={(amount) => { if (videoRef.current) videoRef.current.currentTime += amount; }} 
          settings={settings} 
          onUpdateSettings={onUpdateSettings} 
          isRecording={isRecording} 
          onToggleRecording={toggleRecording} 
        />
      </div>
    </div>
  );
};

export default PlayerContainer;
