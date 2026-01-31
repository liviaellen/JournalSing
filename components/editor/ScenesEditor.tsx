'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, RefreshCw, Plus, Trash2, Camera, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useJournalSingStore } from '@/lib/store'
import { generateScenes } from '@/lib/api/generation'
import { useToast } from '@/components/ui/use-toast'

export function ScenesEditor() {
  const {
    condensedText, lyrics, scenes, setScenes, updateScene,
    videoDuration, setVideoDuration, isGenerating, setIsGenerating
  } = useJournalSingStore()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const { toast } = useToast()

  const handleRegenerate = async () => {
    if (!lyrics?.text || isGenerating) return
    setIsRegenerating(true)
    setIsGenerating(true)
    try {
      const newScenes = await generateScenes(lyrics.text, videoDuration)
      setScenes(newScenes)
      toast({
        title: 'Scenes regenerated',
        description: 'New visual storyboard created.',
      })
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: 'Could not generate new scenes.',
        variant: 'destructive',
      })
    } finally {
      setIsRegenerating(false)
      setIsGenerating(false)
    }
  }

  const handleAddScene = () => {
    const newId = (scenes.length + 1).toString()
    const lastScene = scenes[scenes.length - 1]
    setScenes([...scenes, {
      id: newId,
      prompt: '',
      startTime: lastScene?.endTime || 0,
      endTime: (lastScene?.endTime || 0) + 10
    }])
  }

  const handleRemoveScene = (id: string) => {
    setScenes(scenes.filter(s => s.id !== id))
  }

  if (scenes.length === 0 && !isRegenerating && lyrics?.text) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ImageIcon className="w-12 h-12 text-muted-foreground opacity-20" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Generate Your Storyboard</h3>
          <p className="text-muted-foreground">Your lyrics are ready! Now create the visual plan for your video.</p>
        </div>
        <Button onClick={handleRegenerate} size="lg" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Generate Scenes from Lyrics
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Storyboard</h2>
        <p className="text-muted-foreground">
          AI has planned these scenes based on your lyrics. You can refine the prompts or timing.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Scene Timeline
          </h3>
          <div className="flex gap-2">
            {[30, 60, 90].map((d) => (
              <Button
                key={d}
                variant={videoDuration === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVideoDuration(d)}
                className="h-8"
              >
                {d}s
              </Button>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Auto-Design
        </Button>
      </div>

      <div className="grid gap-4 relative min-h-[400px]">
        {isRegenerating && (
          <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300 rounded-xl border-2 border-primary/20 bg-primary/5">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h3 className="text-2xl font-bold">Storyboarding your video...</h3>
            <p className="text-muted-foreground mt-3 max-w-sm text-lg leading-relaxed">
              We're analyzing your lyrics to create 6 specific, cinematic scenes that perfectly match your research results.
            </p>
          </div>
        )}
        {scenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {scene.startTime}s - {scene.endTime}s
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {index === 0 ? 'Start Frame' : index === scenes.length - 1 ? 'End Frame' : 'Transition'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={scene.endTime}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScene(scene.id, { endTime: parseInt(e.target.value) || 0 })}
                          className="w-16 h-7 text-xs px-2"
                        />
                        {scenes.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveScene(scene.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="relative group">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={scene.prompt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScene(scene.id, { prompt: e.target.value })}
                        className="pl-10 h-10 bg-muted/30"
                        placeholder="Describe the visual for this scene..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed py-6"
        onClick={handleAddScene}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Scene
      </Button>

      <div className="p-4 rounded-lg bg-muted/50 border flex items-start gap-3">
        <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Tip: Use descriptive language like **"cinematic lighting"** or **"cyberpunk city"** to get better visual results.
        </p>
      </div>
    </div>
  )
}
