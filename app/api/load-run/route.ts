import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      )
    }

    const runPath = path.join(process.cwd(), 'results', `run_${runId}`)

    // Read all files in the run directory
    const files = await readdir(runPath)

    // Load lyrics
    let lyrics = null
    if (files.includes('lyric.txt')) {
      const lyricContent = await readFile(path.join(runPath, 'lyric.txt'), 'utf-8')
      lyrics = { text: lyricContent }
    }

    // Load scenes
    let scenes = []
    if (files.includes('storyboard.txt')) {
      const sceneContent = await readFile(path.join(runPath, 'storyboard.txt'), 'utf-8')
      scenes = JSON.parse(sceneContent)
    }

    // Load music URL (stored as text file with URL)
    let musicUrl = null
    if (files.includes('music.mp3')) {
      musicUrl = `/api/results/run_${runId}/music.mp3`
    }

    // Load image URLs (scene_X_start.png, scene_X_end.png)
    const imageFiles = files.filter(f =>
      (f.includes('_start.png') || f.includes('_end.png')) && f.startsWith('scene_')
    )
    const images = imageFiles.map(f => `/api/results/run_${runId}/${f}`)

    // Load video URLs (scene_X_video.mp4)
    const videoFiles = files.filter(f => f.includes('_video.mp4') && f.startsWith('scene_'))
    const videos = videoFiles.map(f => `/api/results/run_${runId}/${f}`)

    return NextResponse.json({
      runId,
      lyrics,
      scenes,
      musicUrl,
      images,
      videos
    })
  } catch (error: any) {
    console.error('Failed to load run:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load run' },
      { status: 500 }
    )
  }
}
