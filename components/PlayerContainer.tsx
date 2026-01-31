
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
  const mainAnalyserRef = useRef<AnalyserNode | null>(null);
  
  const lowCutFilterRef = useRef<BiquadFilterNode | null>(null);
  const highCutFilterRef = useRef<BiquadFilterNode | null>(null);
  const voiceEnhancerRef = useRef<BiquadFilterNode | null>(null);
  const compensationGainRef = useRef<GainNode | null>(null);
  const clarityFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const totalSkippedTimeRef = useRef<number>(0);
  const isCurrentlySkippingRef = useRef<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [silenceDurationSeconds, setSilenceDurationSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    // تهيئة العقد الصوتية مع ضبط الأنواع الافتراضية لمنع كتم الصوت
    if (!sourceRef.current) sourceRef.current = ctx.createMediaElementSource(videoRef.current);
    if (!mainAnalyserRef.current) mainAnalyserRef.current = ctx.createAnalyser();
    if (!streamDestinationRef.current) streamDestinationRef.current = ctx.createMediaStreamDestination();
    
    if (!lowCutFilterRef.current) {
      lowCutFilterRef.current = ctx.createBiquadFilter();
      lowCutFilterRef.current.type = 'highpass';
      lowCutFilterRef.current.frequency.value = 20; // تمرير كل شيء في البداية
    }
    if (!highCutFilterRef.current) {
      highCutFilterRef.current = ctx.createBiquadFilter();
      highCutFilterRef.current.type = 'lowpass';
      highCutFilterRef.current.frequency.value = 20000; // تمرير كل شيء في البداية
    }
    if (!voiceEnhancerRef.current) {
      voiceEnhancerRef.current = ctx.createBiquadFilter();
      voiceEnhancerRef.current.type = 'peaking';
      voiceEnhancerRef.current.frequency.value = 2000;
      voiceEnhancerRef.current.gain.value = 0;
      voiceEnhancerRef.current.Q.value = 1.0;
    }
    if (!compensationGainRef.current) {
      compensationGainRef.current = ctx.createGain();
      compensationGainRef.current.gain.value = 1.0;
    }
    if (!clarityFilterRef.current) {
      clarityFilterRef.current = ctx.createBiquadFilter();
      clarityFilterRef.current.type = 'peaking';
      clarityFilterRef.current.frequency.value = 3200;
      clarityFilterRef.current.gain.value = 0;
      clarityFilterRef.current.Q.value = 1.5;
    }
    if (!compressorRef.current) {
      compressorRef.current = ctx.createDynamicsCompressor();
      compressorRef.current.threshold.value = -20;
    }
    if (!vadAnalyserRef.current) {
      vadAnalyserRef.current = ctx.createAnalyser();
      vadAnalyserRef.current.fftSize = 2048;
    }

    // توصيل الشبكة الصوتية
    sourceRef.current.disconnect();
    sourceRef.current.connect(lowCutFilterRef.current);
    lowCutFilterRef.current.connect(highCutFilterRef.current);
    highCutFilterRef.current.connect(voiceEnhancerRef.current);
    voiceEnhancerRef.current.connect(compensationGainRef.current);
    compensationGainRef.current.connect(clarityFilterRef.current);
    clarityFilterRef.current.connect(compressorRef.current);
    compressorRef.current.connect(mainAnalyserRef.current);
    mainAnalyserRef.current.connect(ctx.destination);
    
    compressorRef.current.connect(streamDestinationRef.current);
    sourceRef.current.connect(vadAnalyserRef.current);

    return () => {
      silenceStartTimeRef.current = null;
      setSilenceDetected(false);
    };
  }, [file]);

  const toggleRecording = async () => {
    if (!isRecording) await startRecording();
    else stopRecording();
  };

  const startRecording = async () => {
    if (!streamDestinationRef.current || !audioContextRef.current) return;
    try {
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: false });
      displayStreamRef.current = displayStream;
      recordedChunksRef.current = [];
      const combinedStream = new MediaStream([...displayStream.getVideoTracks(), ...streamDestinationRef.current.stream.getAudioTracks()]);
      displayStream.getVideoTracks()[0].onended = () => stopRecording();
      const options = { mimeType: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,opus') ? 'video/mp4;codecs=avc1,opus' : 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(combinedStream, options);
      recorder.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sawtify_Capture_${Date.now()}.${options.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        a.click();
        displayStream.getTracks().forEach(t => t.stop());
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isRecording) {
      const itv = setInterval(() => setRecordingTime(p => p + 1), 1000);
      return () => clearInterval(itv);
    }
    setRecordingTime(0);
  }, [isRecording]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !lowCutFilterRef.current || !highCutFilterRef.current || !voiceEnhancerRef.current || !compensationGainRef.current) return;
    
    if (settings.noiseReduction) {
      lowCutFilterRef.current.frequency.setTargetAtTime(350, ctx.currentTime, 0.1);
      highCutFilterRef.current.frequency.setTargetAtTime(5500, ctx.currentTime, 0.1);
      voiceEnhancerRef.current.gain.setTargetAtTime(6, ctx.currentTime, 0.1);
      compensationGainRef.current.gain.setTargetAtTime(2.2, ctx.currentTime, 0.1);
    } else {
      lowCutFilterRef.current.frequency.setTargetAtTime(20, ctx.currentTime, 0.1);
      highCutFilterRef.current.frequency.setTargetAtTime(20000, ctx.currentTime, 0.1);
      voiceEnhancerRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      compensationGainRef.current.gain.setTargetAtTime(1.0, ctx.currentTime, 0.1);
    }
  }, [settings.noiseReduction]);

  useEffect(() => {
    if (clarityFilterRef.current && compressorRef.current) {
      clarityFilterRef.current.gain.value = settings.speechClarity ? 12 : 0;
      compressorRef.current.threshold.value = settings.speechClarity ? -38 : -20;
    }
  }, [settings.speechClarity]);

  useEffect(() => {
    let animationId: number;
    const dataArray = new Float32Array(vadAnalyserRef.current?.frequencyBinCount || 0);
    const checkSilence = () => {
      if (vadAnalyserRef.current && isPlaying && settings.skipSilence && videoRef.current) {
        vadAnalyserRef.current.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sumSquares / dataArray.length);
        if (rms < 0.013) {
          if (!silenceStartTimeRef.current) silenceStartTimeRef.current = performance.now();
          const dur = performance.now() - silenceStartTimeRef.current;
          setSilenceDurationSeconds(dur / 1000);
          if (dur > 2000) {
            setSilenceDetected(true);
            isCurrentlySkippingRef.current = true;
            videoRef.current.playbackRate = Math.min(settings.playbackRate * 8, 10);
            totalSkippedTimeRef.current += (1/60);
          }
        } else {
          silenceStartTimeRef.current = null;
          setSilenceDurationSeconds(0);
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

  const togglePlay = () => {
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

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
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Capture: {formatTime(recordingTime)} (MP4)</span>
            </div>
          )}
          {file.type === 'video' ? (
            <video ref={videoRef} src={file.url} crossOrigin="anonymous" className="w-full h-auto max-h-[60vh] object-contain" onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)} onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)} onEnded={() => setIsPlaying(false)} onClick={togglePlay} />
          ) : (
            <div className="w-full h-80 bg-slate-900 flex flex-col items-center justify-center p-8 relative">
              <Visualizer analyser={mainAnalyserRef.current} isPlaying={isPlaying} />
              <video ref={videoRef} src={file.url} className="hidden" crossOrigin="anonymous" onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)} onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)} onEnded={() => setIsPlaying(false)} />
              <div className="mt-8 text-center max-w-full z-10">
                <p className="text-xl font-black text-white mb-2 truncate px-4">{file.name}</p>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${silenceDetected ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {silenceDetected ? '⚡ Skipping Silence' : '🗣️ Speech Active'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mb-8">
        <div className="mb-8">
          <div className="flex justify-between text-[11px] font-black text-slate-500 mb-3 uppercase tracking-widest">
            <span className="text-blue-400">{formatTime(currentTime)}</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full cursor-pointer relative overflow-hidden" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (videoRef.current) videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}>
            <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
          </div>
        </div>
        <Controls isPlaying={isPlaying} onTogglePlay={togglePlay} onSeek={(amount) => { if (videoRef.current) videoRef.current.currentTime += amount; }} settings={settings} onUpdateSettings={onUpdateSettings} isRecording={isRecording} onToggleRecording={toggleRecording} />
      </div>
    </div>
  );
};

export default PlayerContainer;
