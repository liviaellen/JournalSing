'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Loader2, Volume2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useJournalSingStore } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { AVAILABLE_VOICES } from '@/types'
import { cn } from '@/lib/utils'

export function VoiceSelector() {
  const { voiceSettings, setVoiceSettings, editedText, speechPreview, setSpeechPreview } =
    useJournalSingStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const selectedVoice = AVAILABLE_VOICES.find((v) => v.id === voiceSettings.voiceId)

  const handleVoiceSelect = (voiceId: string) => {
    setVoiceSettings({ voiceId })
    setSpeechPreview(null)
    if (audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!editedText || editedText.length < 10) {
      toast({
        title: 'Text too short',
        description: 'Please add more text in the previous step.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      const previewText = editedText.slice(0, 500) // Limit for preview

      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: previewText,
          voiceId: voiceSettings.voiceId,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const data = await response.json()

      setSpeechPreview({
        url: data.url,
        duration: data.duration,
        type: 'speech',
      })

      toast({
        title: 'Speech generated',
        description: 'Preview is ready to play.',
      })
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate speech. Please check your API key.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPause = () => {
    if (!speechPreview?.url) return

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(speechPreview.url)
      audio.onended = () => setIsPlaying(false)
      audio.play()
      setAudioElement(audio)
      setIsPlaying(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Voice</h2>
        <p className="text-muted-foreground">
          Select a voice and customize how your text will sound
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Voice selection */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Label>Select Voice</Label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_VOICES.map((voice) => (
              <Card
                key={voice.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  voice.id === voiceSettings.voiceId && 'border-primary bg-primary/5'
                )}
                onClick={() => handleVoiceSelect(voice.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        voice.gender === 'male'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-pink-500/10 text-pink-500'
                      )}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {voice.language}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Voice settings */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <span className="text-sm text-muted-foreground">
                    {voiceSettings.speed.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.speed]}
                  onValueChange={([value]) => setVoiceSettings({ speed: value })}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Pitch</Label>
                  <span className="text-sm text-muted-foreground">
                    {voiceSettings.pitch.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.pitch]}
                  onValueChange={([value]) => setVoiceSettings({ pitch: value })}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label>Language</Label>
                <Select
                  value={voiceSettings.language}
                  onValueChange={(value) => setVoiceSettings({ language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
                {speechPreview && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              {speechPreview && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Preview ready ({Math.round(speechPreview.duration)}s)
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
