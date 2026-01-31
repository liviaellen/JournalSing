'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, RefreshCw, Check, Edit3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useJournalSingStore } from '@/lib/store'
import { generateLyrics } from '@/lib/api/generation'
import { useToast } from '@/components/ui/use-toast'

export function LyricsEditor() {
  const {
    editedText, lyrics, setLyrics, videoDuration,
    musicPreview, setMusicPreview, setProgress, runId,
    isGenerating, setIsGenerating
  } = useJournalSingStore()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isMusicGenerating, setIsMusicGenerating] = useState(false)
  const [localLyrics, setLocalLyrics] = useState(lyrics?.text || '')
  const { toast } = useToast()

  // Auto-populate when lyrics are generated in the background
  useEffect(() => {
    if (lyrics?.text && !localLyrics) {
      setLocalLyrics(lyrics.text)
    }
  }, [lyrics, localLyrics])

  const handleRegenerate = async () => {
    if (isGenerating) return
    setIsRegenerating(true)
    setIsGenerating(true)
    try {
      const newLyrics = await generateLyrics(editedText, videoDuration)
      setLyrics(newLyrics)
      setLocalLyrics(newLyrics.text)
      toast({
        title: 'Lyrics regenerated',
        description: 'New song structure and lyrics created.',
      })
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: 'Could not generate new lyrics.',
        variant: 'destructive',
      })
    } finally {
      setIsRegenerating(false)
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (lyrics) {
      setLyrics({ ...lyrics, text: localLyrics })
      toast({
        title: 'Changes saved',
        description: 'Your lyrics have been updated.',
      })
    }
  }

  const handleGenerateMusic = async () => {
    if (!localLyrics) return
    setIsMusicGenerating(true)
    setProgress({ step: 'generating-music', progress: 10, message: 'Composing the engaging science track...' })

    try {
      const musicResponse = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: localLyrics,
          prompt: "Engaging science tutorial song, high energy, professional vocals, catchy"
        })
      })

      if (!musicResponse.ok) throw new Error('Failed to generate music')
      const musicData = await musicResponse.json()

      setMusicPreview({
        url: musicData.url,
        duration: musicData.duration,
        type: 'music'
      })

      // Save music locally in run folder
      if (runId) {
        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({ runId, type: 'music', content: musicData.url, filename: 'music.mp3' })
        })
      }

      setProgress({ step: 'idle', progress: 100, message: 'Song ready!' })
      toast({ title: 'Song generated!', description: 'You can now listen to the track.' })
    } catch (error: any) {
      toast({
        title: 'Music generation failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsMusicGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Lyrics & Music</h2>
        <p className="text-muted-foreground">
          Refine the lyrics and generate your catchy science track
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
          {(isRegenerating || (!lyrics && !isRegenerating)) && (
            <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold">Designing your science story...</h3>
              <p className="text-sm text-muted-foreground mt-2">Our AI agent is crafting the catchy lyrics for your paper.</p>
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Music className="w-5 h-5" />
                <span className="font-semibold uppercase tracking-wider text-sm">Lyrics Editor</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Re-generate Text
              </Button>
            </div>

            <Textarea
              value={localLyrics}
              onChange={(e) => setLocalLyrics(e.target.value)}
              className="min-h-[400px] font-mono text-sm leading-relaxed bg-background"
              placeholder="[Verse 1]..."
            />

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Check className="w-4 h-4" />
                Save Lyrics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={musicPreview ? 'border-primary/50 bg-primary/5' : 'border-dashed'}>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${musicPreview ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isMusicGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Music className="w-8 h-8" />}
            </div>

            <div>
              <h3 className="text-xl font-semibold">{musicPreview ? 'Music Ready!' : 'Generate Music Track'}</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {musicPreview
                  ? 'Listen to your engaging science story set to music.'
                  : 'Transform these lyrics into a catchy high-energy song.'}
              </p>
            </div>

            {musicPreview ? (
              <div className="space-y-4 w-full">
                <audio src={musicPreview.url} controls className="w-full" />
                <Button variant="outline" onClick={handleGenerateMusic} disabled={isMusicGenerating} className="w-full">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isMusicGenerating ? 'animate-spin' : ''}`} />
                  Regenerate Audio
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateMusic} disabled={isMusicGenerating || !localLyrics} size="lg" className="px-8 flex items-center gap-2">
                {isMusicGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Generate Music
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border flex items-start gap-3">
        <Edit3 className="w-5 h-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Tip: Your lyrics start with a **"Did you know?"** hook to grab attention. Check the audio to see if it feels catchy!
        </p>
      </div>
    </div>
  )
}
