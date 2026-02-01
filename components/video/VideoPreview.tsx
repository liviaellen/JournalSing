'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Video, Download, Loader2, Play, RefreshCw, CheckCircle, Volume2, Image as ImageIcon } from 'lucide-react'
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
    updateScene,
    setMusicPreview,
    setVideoDuration,
    runId,
  } = useJournalSingStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerateFrames = async () => {
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

      // 2. Sequential Frame Generation
      setProgress({ step: 'generating-images', progress: 20, message: 'Creating cinematic storyboard...' })

      let previousEndFrameUrl: string | undefined = undefined

      for (let i = 0; i < storeScenes.length; i++) {
        const scene = storeScenes[i]
        const stepProgress = 20 + ((i / storeScenes.length) * 60)
        setProgress({
          step: 'generating-images',
          progress: stepProgress,
          message: `Designing Scene ${i + 1}: Start & End frames...`
        })

        // A. Start Frame
        let startFrameUrl = ""
        if (i === 0) {
          // First scene first frame: Text-to-Image
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Cartoony tutorial kids vibes, bright colors, friendly: ${scene.prompt} (Initial state)`,
              aspectRatio: '16:9'
            })
          })
          if (!res.ok) throw new Error(`Failed to generate Scene ${i + 1} start frame`)
          const val = await res.json()
          startFrameUrl = val.data.image_urls[0]
        } else {
          // Continuity: Use previous scene's end frame as current scene's start frame
          startFrameUrl = previousEndFrameUrl!
        }

        // B. End Frame (Image-to-Image based on Start Frame)
        const resEnd = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Cartoony tutorial kids vibes, bright colors, friendly: ${scene.prompt} (Ending state/Result)`,
            aspectRatio: '16:9',
            subjectReference: [{ type: 'character', image_file: startFrameUrl }]
          })
        })
        if (!resEnd.ok) throw new Error(`Failed to generate Scene ${i + 1} end frame`)
        const valEnd = await resEnd.json()
        const endFrameUrl = valEnd.data.image_urls[0]

        // Update Store
        updateScene(scene.id, { startFrameUrl, endFrameUrl })
        previousEndFrameUrl = endFrameUrl

        // Archive locally
        if (runId) {
          await fetch('/api/save-result', {
            method: 'POST',
            body: JSON.stringify({ runId, type: 'image', content: startFrameUrl, filename: `scene_${i + 1}_start.png` })
          })
          await fetch('/api/save-result', {
            method: 'POST',
            body: JSON.stringify({ runId, type: 'image', content: endFrameUrl, filename: `scene_${i + 1}_end.png` })
          })
        }
      }

      setProgress({ step: 'complete', progress: 100, message: 'All storyboard frames ready!' })
      toast({ title: 'Storyboard Complete!', description: '12 cinematic frames generated. Ready for video!' })

    } catch (error: any) {
      console.error('Frame Generation Error:', error)
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate frames.',
        variant: 'destructive',
      })
      setProgress({ step: 'idle', progress: 0, message: '' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateVideos = async () => {
    if (storeScenes.some(s => !s.startFrameUrl || !s.endFrameUrl)) {
      toast({
        title: 'Frames not ready',
        description: 'Please generate storyboard frames first.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      setProgress({ step: 'generating-video', progress: 10, message: 'Generating scene videos...' })

      for (let i = 0; i < storeScenes.length; i++) {
        const scene = storeScenes[i]
        const stepProgress = 10 + ((i / storeScenes.length) * 80)
        setProgress({
          step: 'generating-video',
          progress: stepProgress,
          message: `Creating video for Scene ${i + 1}...`
        })

        const sceneDuration = Math.round(scene.endTime - scene.startTime)

        // Determine video duration and resolution
        // 10s scenes → 10s video @ 768P
        // 6s scenes → 6s video @ 1080P
        let videoDuration: 6 | 10;
        let resolution: '768P' | '1080P';

        if (sceneDuration >= 9) {
          videoDuration = 10;
          resolution = '768P';
        } else {
          videoDuration = 6;
          resolution = '1080P';
        }

        // Try to generate video with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        let success = false;

        while (retryCount <= maxRetries && !success) {
          try {
            if (retryCount > 0) {
              setProgress({
                step: 'generating-video',
                progress: stepProgress,
                message: `Retrying Scene ${i + 1} (attempt ${retryCount + 1}/${maxRetries + 1})...`
              })
            }

            // Generate video for this scene
            const videoResponse = await fetch('/api/generate-scene-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstFrameImage: scene.startFrameUrl,
                lastFrameImage: scene.endFrameUrl,
                prompt: scene.prompt,
                duration: videoDuration,
                resolution: resolution
              })
            })

            if (!videoResponse.ok) throw new Error(`Failed to start video generation for Scene ${i + 1}`)
            const videoData = await videoResponse.json()

            // Poll for completion with timeout
            const finalVideo = await pollTaskStatus(videoData.task_id)

            // Update scene with video URL
            updateScene(scene.id, { videoUrl: finalVideo.videoUrl })

            // Archive locally
            if (runId) {
              await fetch('/api/save-result', {
                method: 'POST',
                body: JSON.stringify({ runId, type: 'video', content: finalVideo.videoUrl, filename: `scene_${i + 1}_video.mp4` })
              })
            }

            success = true;
          } catch (error: any) {
            retryCount++;
            console.error(`Scene ${i + 1} video generation error (attempt ${retryCount}):`, error)

            if (retryCount > maxRetries) {
              // Skip this scene after max retries
              console.warn(`Skipping Scene ${i + 1} after ${maxRetries + 1} failed attempts`)
              toast({
                title: `Scene ${i + 1} skipped`,
                description: `Failed to generate video after ${maxRetries + 1} attempts. Continuing with next scene.`,
                variant: 'destructive',
              })
              break;
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
        }
      }

      setProgress({ step: 'complete', progress: 100, message: 'All scene videos ready!' })
      toast({ title: 'Videos Complete!', description: `${storeScenes.filter(s => s.videoUrl).length} scene videos generated successfully!` })

    } catch (error: any) {
      console.error('Video Generation Error:', error)
      toast({
        title: 'Video generation failed',
        description: error.message || 'Failed to generate videos.',
        variant: 'destructive',
      })
      setProgress({ step: 'idle', progress: 0, message: '' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStitchVideos = async () => {
    const sceneVideoUrls = storeScenes.map(s => s.videoUrl).filter(Boolean)

    if (sceneVideoUrls.length === 0) {
      toast({
        title: 'No videos to stitch',
        description: 'Please generate scene videos first.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      setProgress({ step: 'generating-video', progress: 10, message: 'Stitching videos together...' })

      const response = await fetch('/api/stitch-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneVideos: sceneVideoUrls,
          musicUrl: musicPreview?.url,
          outputFilename: `final_video_${Date.now()}.mp4`
        })
      })

      if (!response.ok) throw new Error('Failed to stitch videos')

      const data = await response.json()

      // Calculate total duration from scenes
      const totalDuration = storeScenes.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)

      // Set the final video result
      setVideoResult({
        url: data.video,
        duration: totalDuration,
        format: 'mp4'
      })

      toast({
        title: 'Video Complete!',
        description: `Combined ${sceneVideoUrls.length} scenes with music into final video!`
      })

    } catch (error: any) {
      console.error('Video stitching error:', error)
      toast({
        title: 'Stitching failed',
        description: error.message || 'Failed to combine videos.',
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

      {/* Storyboard Grid */}
      {storeScenes.some(s => s.startFrameUrl || s.endFrameUrl) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Scene Storyboard (12 Frames)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeScenes.map((scene, idx) => (
                  <div key={scene.id} className="space-y-3 p-4 rounded-lg border border-primary/10 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-primary">
                        Scene {idx + 1}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scene.startTime}s - {scene.endTime}s
                      </div>
                    </div>

                    {/* Scene Description */}
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                      {scene.prompt}
                    </div>

                    {/* Start & End Frames */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Start Frame */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground">Start Frame</div>
                        <div className="aspect-video rounded-md overflow-hidden bg-muted relative group">
                          {scene.startFrameUrl ? (
                            <img src={scene.startFrameUrl} alt={`S${idx + 1} Start`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">Pending</div>
                          )}
                        </div>
                      </div>

                      {/* End Frame */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground">End Frame</div>
                        <div className="aspect-video rounded-md overflow-hidden bg-muted relative group">
                          {scene.endFrameUrl ? (
                            <img src={scene.endFrameUrl} alt={`S${idx + 1} End`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">Pending</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scene Videos Grid */}
      {storeScenes.some(s => s.videoUrl) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-green-600" />
                Generated Scene Videos ({storeScenes.filter(s => s.videoUrl).length}/6)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeScenes.map((scene, idx) => (
                  scene.videoUrl && (
                    <div key={scene.id} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Scene {idx + 1} ({scene.startTime}s - {scene.endTime}s)
                      </div>
                      <div className="aspect-video rounded-md overflow-hidden bg-black">
                        <video
                          src={scene.videoUrl}
                          controls
                          className="w-full h-full"
                          poster={scene.startFrameUrl}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{scene.prompt}</p>
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                    {storeScenes.every(s => s.startFrameUrl && s.endFrameUrl) ? (
                      <Video className="w-10 h-10 text-primary" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {storeScenes.every(s => s.startFrameUrl && s.endFrameUrl)
                        ? 'Ready for Video Generation'
                        : 'Create Storyboard Frames'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {!musicPreview
                        ? 'Generate the song above to unlock storyboard generation.'
                        : storeScenes.every(s => s.startFrameUrl && s.endFrameUrl)
                          ? 'All 12 frames ready! Now generate videos for each scene.'
                          : 'First, generate 12 storyboard frames (start & end for each scene).'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Button 1: Generate Frames */}
                    {!storeScenes.every(s => s.startFrameUrl && s.endFrameUrl) && (
                      <Button
                        size="lg"
                        onClick={handleGenerateFrames}
                        className="px-8"
                        disabled={!musicPreview || isGenerating}
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ImageIcon className="w-5 h-5 mr-2" />}
                        Generate Storyboard Frames
                      </Button>
                    )}

                    {/* Button 2: Generate Videos */}
                    {storeScenes.every(s => s.startFrameUrl && s.endFrameUrl) && !storeScenes.some(s => s.videoUrl) && (
                      <Button
                        size="lg"
                        onClick={handleGenerateVideos}
                        className="px-8"
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                        Generate Scene Videos
                      </Button>
                    )}

                    {/* Button 3: Stitch Final Video */}
                    {storeScenes.some(s => s.videoUrl) && !videoResult && (
                      <Button
                        size="lg"
                        onClick={handleStitchVideos}
                        className="px-8 bg-green-600 hover:bg-green-700"
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Video className="w-5 h-5 mr-2" />}
                        Stitch Final Video with Music
                      </Button>
                    )}
                  </div>
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
