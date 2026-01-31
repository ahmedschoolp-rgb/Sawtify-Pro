
export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'audio' | 'video';
  size: number;
}

export interface PlayerSettings {
  playbackRate: number;
  skipSilence: boolean;
  noiseReduction: boolean;
  speechClarity: boolean; // ميزة تعزيز مخارج الحروف الجديدة
  seekAmount: number;
  volume: number;
}

export enum FilterType {
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  BANDPASS = 'bandpass',
  PEAKING = 'peaking'
}
