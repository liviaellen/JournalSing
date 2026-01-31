import { create } from 'zustand'
import type {
  PDFDocument, VoiceSettings, MusicStyle, GenerationProgress,
  AudioPreview, VideoResult, MusicLyrics, ScenePrompt, ImageToImageData
} from '@/types'

interface JournalSingState {
  // Current step in workflow (1-5)
  currentStep: number
  setCurrentStep: (step: number) => void

  // PDF Document
  document: PDFDocument | null
  setDocument: (doc: PDFDocument | null) => void

  // Edited text
  editedText: string
  setEditedText: (text: string) => void

  condensedText: string
  setCondensedText: (text: string) => void

  videoDuration: number
  setVideoDuration: (duration: number) => void

  // Voice settings
  voiceSettings: VoiceSettings
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void

  // Music style
  musicStyle: MusicStyle
  setMusicStyle: (style: Partial<MusicStyle>) => void

  // Generation progress
  progress: GenerationProgress
  setProgress: (progress: Partial<GenerationProgress>) => void

  // Audio previews
  speechPreview: AudioPreview | null
  setSpeechPreview: (preview: AudioPreview | null) => void

  musicPreview: AudioPreview | null
  setMusicPreview: (preview: AudioPreview | null) => void

  // Final video
  videoResult: VideoResult | null
  setVideoResult: (result: VideoResult | null) => void

  // Generation status
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // Lyrics and Scenes
  lyrics: MusicLyrics | null
  setLyrics: (lyrics: MusicLyrics | null) => void

  scenes: ScenePrompt[]
  setScenes: (scenes: ScenePrompt[]) => void
  updateScene: (id: string, updates: Partial<ScenePrompt>) => void

  // Image to Image
  imageToImage: ImageToImageData
  setImageToImage: (data: Partial<ImageToImageData>) => void

  // Run Tracking
  runId: string | null
  setRunId: (id: string | null) => void

  // Helpers
  reSyncScenes: (totalDuration: number) => void

  // Reset all state
  reset: () => void
}

const initialVoiceSettings: VoiceSettings = {
  voiceId: 'English_Graceful_Lady',
  speed: 1.0,
  pitch: 1.0,
  language: 'en-US',
}

const initialMusicStyle: MusicStyle = {
  genre: 'ambient',
  mood: 'inspirational',
  tempo: 120,
}

const initialProgress: GenerationProgress = {
  step: 'idle',
  progress: 0,
  message: '',
}

export const useJournalSingStore = create<JournalSingState>((set) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  document: null,
  setDocument: (doc) => set({ document: doc, editedText: doc?.text || '' }),

  editedText: '',
  setEditedText: (editedText) => set({ editedText }),

  condensedText: '',
  setCondensedText: (condensedText) => set({ condensedText }),

  videoDuration: 60,
  setVideoDuration: (videoDuration) => set({ videoDuration }),

  voiceSettings: initialVoiceSettings,
  setVoiceSettings: (settings) => set((state) => ({
    voiceSettings: { ...state.voiceSettings, ...settings }
  })),

  musicStyle: initialMusicStyle,
  setMusicStyle: (style) => set((state) => ({
    musicStyle: { ...state.musicStyle, ...style }
  })),

  progress: initialProgress,
  setProgress: (progress) => set((state) => ({
    progress: { ...state.progress, ...progress }
  })),

  speechPreview: null,
  setSpeechPreview: (preview) => set({ speechPreview: preview }),

  musicPreview: null,
  setMusicPreview: (preview) => set({ musicPreview: preview }),

  videoResult: null,
  setVideoResult: (result) => set({ videoResult: result }),

  lyrics: null,
  setLyrics: (lyrics) => set({ lyrics }),

  scenes: [],
  setScenes: (scenes) => set({ scenes }),
  updateScene: (id, updates) => set((state) => ({
    scenes: state.scenes.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  imageToImage: {},
  setImageToImage: (data) => set((state) => ({
    imageToImage: { ...state.imageToImage, ...data }
  })),

  runId: null,
  setRunId: (runId) => set({ runId }),

  reSyncScenes: (totalDuration) => set((state) => {
    if (state.scenes.length === 0) return state;
    const sceneCount = state.scenes.length;
    const sliceDuration = totalDuration / sceneCount;

    return {
      scenes: state.scenes.map((scene, index) => ({
        ...scene,
        startTime: Number((index * sliceDuration).toFixed(1)),
        endTime: Number(((index + 1) * sliceDuration).toFixed(1))
      }))
    };
  }),

  reset: () => set({
    currentStep: 1,
    document: null,
    editedText: '',
    condensedText: '',
    videoDuration: 60,
    voiceSettings: initialVoiceSettings,
    musicStyle: initialMusicStyle,
    progress: initialProgress,
    speechPreview: null,
    musicPreview: null,
    videoResult: null,
    lyrics: null,
    scenes: [],
    imageToImage: {},
    runId: null,
    isGenerating: false,
  }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}))
