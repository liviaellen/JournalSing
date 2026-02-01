'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Music, Image as ImageIcon, Video, FileText, Loader2, Sparkles } from 'lucide-react'
import { useJournalSingStore } from '@/lib/store'

interface Run {
  runId: string
  timestamp: number
  createdAt: string
  hasLyrics: boolean
  hasScenes: boolean
  hasMusic: boolean
  hasImages: boolean
  hasVideos: boolean
}

export function RunHistorySidebar() {
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null)
  const { setLyrics, setScenes, updateScene, setRunId, setMusicPreview, reset } = useJournalSingStore()

  useEffect(() => {
    loadRuns()
  }, [])

  const loadRuns = async () => {
    try {
      const response = await fetch('/api/list-runs')
      if (!response.ok) throw new Error('Failed to load runs')
      const data = await response.json()
      setRuns(data.runs)
    } catch (error: any) {
      console.error('Failed to load runs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRun = async (runId: string) => {
    setLoadingRunId(runId)
    try {
      const response = await fetch(`/api/load-run?runId=${runId}`)
      if (!response.ok) throw new Error('Failed to load run')
      const data = await response.json()

      // Load lyrics
      if (data.lyrics) {
        console.log('Loading lyrics:', data.lyrics.text.substring(0, 50) + '...')
        setLyrics(data.lyrics)
      }

      // Load scenes with image/video URLs
      // Load scenes and merge with images/videos
      if (data.scenes && data.scenes.length > 0) {
        console.log('Loading scenes:', data.scenes.length)

        // Create a deep copy of scenes to modify
        const mergedScenes = data.scenes.map((s: any) => ({ ...s }))

        // Match images to scenes locally
        data.images.forEach((imgUrl: string) => {
          const match = imgUrl.match(/scene_(\d+)_(start|end)/)
          if (match) {
            const sceneNum = parseInt(match[1])
            const frameType = match[2]
            const sceneIndex = sceneNum - 1
            if (mergedScenes[sceneIndex]) {
              console.log(`Matching ${frameType} frame for scene ${sceneNum}`)
              mergedScenes[sceneIndex][frameType === 'start' ? 'startFrameUrl' : 'endFrameUrl'] = imgUrl
            }
          }
        })

        // Match videos to scenes locally
        data.videos.forEach((vidUrl: string) => {
          const match = vidUrl.match(/scene_(\d+)_video/)
          if (match) {
            const sceneNum = parseInt(match[1])
            const sceneIndex = sceneNum - 1
            if (mergedScenes[sceneIndex]) {
              console.log(`Matching video for scene ${sceneNum}`)
              mergedScenes[sceneIndex].videoUrl = vidUrl
            }
          }
        })

        // Set all scenes at once with their data
        setScenes(mergedScenes)
      }

      // Load music preview
      if (data.musicUrl) {
        const duration = data.scenes.reduce((sum: number, s: any) => sum + (s.endTime - s.startTime), 0) || 60
        console.log('Loading music:', data.musicUrl, 'duration:', duration)
        setMusicPreview({
          url: data.musicUrl,
          duration: duration,
          type: 'music'
        })
      }

      // Set current run ID
      setRunId(runId)

      console.log(`Run loaded from ${new Date(parseInt(runId)).toLocaleString()}`)
    } catch (error: any) {
      console.error('Failed to load run:', error)
    } finally {
      setLoadingRunId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Run History
        </h3>

        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => {
            reset()
            console.log('Started new run - all fields cleared')
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start New Run
        </Button>

        <p className="text-xs text-muted-foreground">
          {runs.length} previous {runs.length === 1 ? 'run' : 'runs'}
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {runs.map((run) => (
            <Card
              key={run.runId}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => loadRun(run.runId)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs font-medium">
                    {formatDate(run.timestamp)}
                  </div>
                  {loadingRunId === run.runId && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {run.hasLyrics && (
                    <div className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                      <FileText className="w-3 h-3" />
                      Lyrics
                    </div>
                  )}
                  {run.hasMusic && (
                    <div className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">
                      <Music className="w-3 h-3" />
                      Music
                    </div>
                  )}
                  {run.hasImages && (
                    <div className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">
                      <ImageIcon className="w-3 h-3" />
                      Frames
                    </div>
                  )}
                  {run.hasVideos && (
                    <div className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded">
                      <Video className="w-3 h-3" />
                      Videos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
