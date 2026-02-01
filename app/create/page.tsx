'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { StepIndicator } from '@/components/workflow/StepIndicator'
import { PDFDropzone } from '@/components/upload/PDFDropzone'
import { TextEditor } from '@/components/editor/TextEditor'
import { VoiceSelector } from '@/components/voice/VoiceSelector'
import { MusicStylePicker } from '@/components/music/MusicStylePicker'
import { VideoPreview } from '@/components/video/VideoPreview'
import { LyricsEditor } from '@/components/editor/LyricsEditor'
import { ScenesEditor } from '@/components/editor/ScenesEditor'
import { RunHistorySidebar } from '@/components/history/RunHistorySidebar'
import { useJournalSingStore } from '@/lib/store'

const steps = [
  { id: 1, title: 'Upload', description: 'Drop your paper' },
  { id: 2, title: 'Lyrics', description: 'Review catchy text' },
  { id: 3, title: 'Visuals', description: 'Storyboard & Video' },
]

export default function CreatePage() {
  const { currentStep, setCurrentStep, document, lyrics, scenes, progress, musicPreview } = useJournalSingStore()

  // Auto-navigate to appropriate step when loading a run
  useEffect(() => {
    if (lyrics && currentStep === 1) {
      // If we have lyrics but we're on step 1, skip to step 2
      setCurrentStep(2)
    } else if (musicPreview && scenes.length > 0 && currentStep < 3) {
      // If we have music and scenes, go to step 3
      setCurrentStep(3)
    }
  }, [lyrics, musicPreview, scenes, currentStep, setCurrentStep])

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!document
      case 2: return !!lyrics && lyrics.text.length > 10
      case 3: return true
      default: return false
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PDFDropzone />
      case 2:
        return <LyricsEditor />
      case 3:
        return (
          <div className="space-y-12">
            <ScenesEditor />
            <div className="h-px bg-border w-full" />
            <VideoPreview />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Create ELI5 Video</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Run History */}
        <div className="w-64 border-r bg-background/50 backdrop-blur-sm">
          <RunHistorySidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Step Indicator */}
            <StepIndicator steps={steps} currentStep={currentStep} />

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              {renderStepContent()}
            </motion.div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              {currentStep < 3 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || (currentStep === 2 && progress.step !== 'idle' && progress.step !== 'complete')}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
