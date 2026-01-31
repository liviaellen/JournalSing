'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Loader2, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useJournalSingStore } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { MUSIC_GENRES, MUSIC_MOODS, type MusicGenre, type MusicMood } from '@/types'
import { cn } from '@/lib/utils'

const genreIcons: Record<MusicGenre, string> = {
  electronic: '🎹',
  classical: '🎻',
  pop: '🎤',
  ambient: '🌊',
  jazz: '🎷',
  rock: '🎸',
}

export function MusicStylePicker() {
  const { musicStyle, setMusicStyle, editedText, musicPreview, setMusicPreview } =
    useJournalSingStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const handleGenreSelect = (genre: MusicGenre) => {
    setMusicStyle({ genre })
    setMusicPreview(null)
    if (audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    }
  }

  const handleMoodSelect = (mood: string) => {
    if (mood) {
      setMusicStyle({ mood })
    }
  }

  const handleGenerateMusic = async () => {
    if (!editedText || editedText.length < 10) {
      toast({
        title: 'Text required',
        description: 'Please add text in the previous steps.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: editedText.slice(0, 1000),
          genre: musicStyle.genre,
          mood: musicStyle.mood,
          tempo: musicStyle.tempo,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate music')
      }

      const data = await response.json()

      setMusicPreview({
        url: data.url,
        duration: data.duration,
        type: 'music',
      })

      toast({
        title: 'Music generated',
        description: 'Your music is ready to play.',
      })
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate music. Please check your API key.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPause = () => {
    if (!musicPreview?.url) return

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(musicPreview.url)
      audio.onended = () => setIsPlaying(false)
      audio.play()
      setAudioElement(audio)
      setIsPlaying(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Music Style</h2>
        <p className="text-muted-foreground">
          Select a genre and mood to create the perfect soundtrack
        </p>
      </div>

      {/* Genre selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Label className="text-lg">Genre</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MUSIC_GENRES.map((genre) => (
            <Card
              key={genre.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50 hover:scale-[1.02]',
                genre.id === musicStyle.genre &&
                  'border-primary bg-primary/5 scale-[1.02]'
              )}
              onClick={() => handleGenreSelect(genre.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">{genreIcons[genre.id]}</div>
                <p className="font-medium">{genre.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Mood selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label className="text-lg">Mood</Label>
        <ToggleGroup
          type="single"
          value={musicStyle.mood}
          onValueChange={handleMoodSelect}
          className="flex flex-wrap gap-2 justify-center"
        >
          {MUSIC_MOODS.map((mood) => (
            <ToggleGroupItem
              key={mood.id}
              value={mood.id}
              className="px-6 py-2 rounded-full"
            >
              {mood.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </motion.div>

      {/* Tempo slider */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Tempo</Label>
                <span className="text-sm font-medium text-primary">
                  {musicStyle.tempo} BPM
                </span>
              </div>
              <Slider
                value={[musicStyle.tempo]}
                onValueChange={([value]) => setMusicStyle({ tempo: value })}
                min={60}
                max={180}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>60 BPM (Slow)</span>
                <span>120 BPM (Medium)</span>
                <span>180 BPM (Fast)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerateMusic}
                disabled={isGenerating}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Music...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5 mr-2" />
                    Generate Music
                  </>
                )}
              </Button>
              {musicPreview && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePlayPause}
                  className="px-6"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              )}
            </div>
            {musicPreview && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Music preview ready ({Math.round(musicPreview.duration)}s)
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
