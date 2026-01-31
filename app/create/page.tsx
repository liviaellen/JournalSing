'use client'

import { useState } from 'react'
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
import { useJournalSingStore } from '@/lib/store'

const steps = [
  { id: 1, title: 'Upload', description: 'Drop your paper' },
  { id: 2, title: 'Lyrics', description: 'Review catchy text' },
  { id: 3, title: 'Visuals', description: 'Storyboard & Video' },
]

export default function CreatePage() {
  const { currentStep, setCurrentStep, document, lyrics, scenes, progress } = useJournalSingStore()

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!document
      case 2: return !!lyrics && lyrics.text.length > 10
      case 3: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < 3 && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-bg opacity-5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">JournalSing</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Step Indicator */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
