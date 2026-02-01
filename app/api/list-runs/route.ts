import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const resultsDir = path.join(process.cwd(), 'results')

    // Read all directories in results folder
    const entries = await readdir(resultsDir, { withFileTypes: true })
    const runDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('run_'))

    // Get metadata for each run
    const runs = await Promise.all(
      runDirs.map(async (dir) => {
        const runPath = path.join(resultsDir, dir.name)
        const runId = dir.name.replace('run_', '')

        // Get creation time from directory
        const stats = await stat(runPath)

        // Try to read metadata files
        let hasLyrics = false
        let hasScenes = false
        let hasMusic = false
        let hasImages = false
        let hasVideos = false

        try {
          const files = await readdir(runPath)
          hasLyrics = files.some(f => f === 'lyric.txt')
          hasScenes = files.some(f => f === 'storyboard.txt')
          hasMusic = files.some(f => f === 'music.mp3')
          hasImages = files.some(f => f.includes('frame'))
          hasVideos = files.some(f => f.includes('video'))
        } catch (e) {
          // Ignore errors reading directory
        }

        return {
          runId,
          timestamp: parseInt(runId),
          createdAt: stats.birthtime,
          hasLyrics,
          hasScenes,
          hasMusic,
          hasImages,
          hasVideos
        }
      })
    )

    // Sort by timestamp descending (newest first)
    runs.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({ runs })
  } catch (error: any) {
    console.error('Failed to list runs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list runs' },
      { status: 500 }
    )
  }
}
