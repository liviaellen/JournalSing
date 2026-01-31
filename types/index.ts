export interface PDFDocument {
  title: string
  text: string
  pageCount: number
  fileName: string
}

export interface VoiceSettings {
  voiceId: string
  speed: number
  pitch: number
  language: string
}

export interface MusicStyle {
  genre: string
  mood: string
  tempo: number
}

export interface GenerationProgress {
  step: 'idle' | 'uploading' | 'extracting' | 'generating-lyrics' | 'generating-scenes' | 'generating-images' | 'generating-speech' | 'generating-music' | 'generating-video' | 'complete'
  progress: number
  message: string
}

export interface WorkflowStep {
  id: number
  title: string
  description: string
  isComplete: boolean
  isActive: boolean
}

export interface AudioPreview {
  url: string
  duration: number
  type: 'speech' | 'music'
}

export interface VideoResult {
  url: string
  duration: number
  format: string
  thumbnail?: string
}

export interface MusicLyrics {
  text: string
  structure: string // e.g. "Intro, Verse, Chorus..."
}

export interface ScenePrompt {
  id: string
  prompt: string
  startFrameUrl?: string
  endFrameUrl?: string
  videoUrl?: string
  startTime: number
  endTime: number
}

export interface ImageToImageData {
  characterImageUrl?: string
  startFrameUrl?: string
  endFrameUrl?: string
}

export type MusicGenre = 'electronic' | 'classical' | 'pop' | 'ambient' | 'jazz' | 'rock'
export type MusicMood = 'energetic' | 'calm' | 'inspirational' | 'dramatic' | 'playful'

export interface Voice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female'
  previewUrl?: string
}

// Updated voice IDs from MiniMax documentation
export const AVAILABLE_VOICES: Voice[] = [
  // English voices
  { id: 'English_Graceful_Lady', name: 'Graceful Lady', language: 'English', gender: 'female' },
  { id: 'English_Insightful_Speaker', name: 'Insightful Speaker', language: 'English', gender: 'male' },
  { id: 'English_radiant_girl', name: 'Radiant Girl', language: 'English', gender: 'female' },
  { id: 'English_Persuasive_Man', name: 'Persuasive Man', language: 'English', gender: 'male' },
  { id: 'English_Lucky_Robot', name: 'Lucky Robot', language: 'English', gender: 'male' },
  // Chinese voices
  { id: 'Chinese (Mandarin)_Lyrical_Voice', name: 'Lyrical Voice', language: 'Chinese', gender: 'female' },
  { id: 'Chinese (Mandarin)_HK_Flight_Attendant', name: 'HK Flight Attendant', language: 'Chinese', gender: 'female' },
  // Japanese voices
  { id: 'Japanese_Whisper_Belle', name: 'Whisper Belle', language: 'Japanese', gender: 'female' },
]

export const MUSIC_GENRES: { id: MusicGenre; name: string; icon: string }[] = [
  { id: 'electronic', name: 'Electronic', icon: '🎹' },
  { id: 'classical', name: 'Classical', icon: '🎻' },
  { id: 'pop', name: 'Pop', icon: '🎤' },
  { id: 'ambient', name: 'Ambient', icon: '🌊' },
  { id: 'jazz', name: 'Jazz', icon: '🎷' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
]

export const MUSIC_MOODS: { id: MusicMood; name: string }[] = [
  { id: 'energetic', name: 'Energetic' },
  { id: 'calm', name: 'Calm' },
  { id: 'inspirational', name: 'Inspirational' },
  { id: 'dramatic', name: 'Dramatic' },
  { id: 'playful', name: 'Playful' },
]
