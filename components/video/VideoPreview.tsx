'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Video, Download, Loader2, Play, RefreshCw, CheckCircle, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useJournalSingStore } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { formatDuration } from '@/lib/utils'
import { pollTaskStatus } from '@/lib/api/generation'

export function VideoPreview() {
  const {
    editedText,
    speechPreview,
    musicPreview,
    videoResult,
    setVideoResult,
    progress,
    setProgress,
    reset,
    setLyrics,
    setScenes,
    setImageToImage,
    imageToImage,
    lyrics: storeLyrics,
    scenes: storeScenes,
    setMusicPreview,
    setVideoDuration,
    runId,
  } = useJournalSingStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerateVideo = async () => {
    if (!storeLyrics || storeScenes.length < 2) {
      toast({
        title: 'Missing content',
        description: 'Please ensure lyrics and scenes are generated.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      // 1. Ensure Music exists
      let finalMusicUrl = musicPreview?.url
      if (!finalMusicUrl) {
        setProgress({ step: 'generating-music', progress: 10, message: 'Composing the ELI5 tutorial song...' })
        const musicResponse = await fetch('/api/generate-music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: storeLyrics.text,
            prompt: "Educational tutorial song, high energy, professional vocals"
          })
        })

        if (!musicResponse.ok) throw new Error('Failed to generate music')
        const musicData = await musicResponse.json()
        finalMusicUrl = musicData.url
        setMusicPreview({ url: musicData.url, duration: musicData.duration, type: 'music' })

        // Save music locally in run folder if generated here
        if (runId) {
          await fetch('/api/save-result', {
            method: 'POST',
            body: JSON.stringify({ runId, type: 'music', content: musicData.url, filename: 'music.mp3' })
          })
        }
      }

      // 2. Generate Start/End Frames (Image-to-Image / Text-to-Image)
      setProgress({ step: 'generating-images', progress: 40, message: 'Creating cinematic frames...' })

      const startScene = storeScenes[0]
      const endScene = storeScenes[storeScenes.length - 1]

      // Generate Start Frame
      const startImageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: startScene.prompt, aspectRatio: '16:9' })
      })
      if (!startImageResponse.ok) throw new Error('Failed to generate start frame')
      const startImageData = await startImageResponse.json()
      const startFrameUrl = startImageData.data.image_urls[0]

      // Generate End Frame (Using start frame as character reference for consistency)
      const endImageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: endScene.prompt,
          aspectRatio: '16:9',
          subjectReference: [{ type: 'character', image_file: startFrameUrl }]
        })
      })
      if (!endImageResponse.ok) throw new Error('Failed to generate end frame')
      const endImageData = await endImageResponse.json()
      const endFrameUrl = endImageData.data.image_urls[0]

      setImageToImage({ startFrameUrl, endFrameUrl, characterImageUrl: startFrameUrl })

      // 3. Generate Video Transition (Hailuo-02 Start-End Frame)
      setProgress({ step: 'generating-video', progress: 70, message: 'Animating the transition...' })
      const videoResponse = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Cinematic transition from ${startScene.prompt} to ${endScene.prompt}`,
          firstFrameImage: startFrameUrl,
          lastFrameImage: endFrameUrl,
          duration: 6,
          resolution: '768P'
        })
      })

      if (!videoResponse.ok) throw new Error('Failed to start video generation')
      const videoData = await videoResponse.json()

      // poll for completion
      const finalVideo = await pollTaskStatus(videoData.taskId)

      setVideoResult({
        url: finalVideo.videoUrl,
        duration: 6,
        format: 'mp4'
      })

      // Archive artifacts locally
      if (runId) {
        // 4. Save Images
        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({ runId, type: 'image', content: startFrameUrl, filename: 'start_frame.png' })
        })
        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({ runId, type: 'image', content: endFrameUrl, filename: 'end_frame.png' })
        })
        // 5. Save Video
        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({ runId, type: 'video', content: finalVideo.videoUrl, filename: 'video.mp4' })
        })
      }

      setProgress({ step: 'complete', progress: 100, message: 'Masterpiece complete!' })
      toast({ title: 'Video generated!', description: 'Your cinematic music video is ready.' })

    } catch (error: any) {
      console.error('Final Generation Error:', error)
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate video.',
        variant: 'destructive',
      })
      setProgress({ step: 'idle', progress: 0, message: '' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!videoResult?.url) return

    try {
      const response = await fetch(videoResult.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'journalsing-video.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Download started',
        description: 'Your video is being downloaded.',
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download video.',
        variant: 'destructive',
      })
    }
  }

  const handleStartOver = () => {
    reset()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Generate Your Video</h2>
        <p className="text-muted-foreground">
          Create a stunning music video from your paper
        </p>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Masterpiece Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {storeLyrics?.text.split(/\s+/).length}
                </p>
                <p className="text-xs text-muted-foreground">Lyrics Words</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {storeScenes.length}
                </p>
                <p className="text-xs text-muted-foreground">Storyboard Scenes</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">~{videoResult?.duration || 60}s</p>
                <p className="text-xs text-muted-foreground">Est. Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Music Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={musicPreview ? 'border-primary/50' : 'bg-muted/50 opacity-60'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${musicPreview ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Music Track</h3>
                  <p className="text-sm text-muted-foreground">
                    {musicPreview ? 'Audio track is ready for synchronization' : 'Please go back and generate your song track first'}
                  </p>
                </div>
              </div>
              {musicPreview && (
                <div className="flex items-center gap-4">
                  <audio src={musicPreview.url} controls className="h-10 compact-audio" />
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Video preview or generation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {videoResult ? (
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              <video
                src={videoResult.url}
                controls
                className="w-full h-full"
                poster={videoResult.thumbnail}
              />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Video ready!</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(videoResult.duration)} | Format:{' '}
                    {videoResult.format.toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleStartOver}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={!musicPreview ? 'opacity-50 grayscale' : 'border-primary/50 bg-primary/5'}>
            <CardContent className="p-8">
              {isGenerating ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {progress.message || 'Generating video...'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This may take a few minutes
                    </p>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress.progress)}% complete
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Create Cinematic Video</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {musicPreview
                        ? 'Song is ready! Now let\'s animate your 6-scene storyboard.'
                        : 'Generate the song above to unlock video generation.'}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGenerateVideo}
                    className="px-8"
                    disabled={!musicPreview || isGenerating}
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                    Generate Full Video
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Completion message */}
      {videoResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 text-primary"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Your music video is complete!</span>
        </motion.div>
      )}
    </div>
  )
}
