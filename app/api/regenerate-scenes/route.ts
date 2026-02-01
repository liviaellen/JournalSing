import { NextRequest, NextResponse } from 'next/server'
import { generateScenes } from '@/lib/api/generation'

export async function POST(request: NextRequest) {
  try {
    const { lyrics, duration } = await request.json()

    if (!lyrics || !duration) {
      return NextResponse.json(
        { error: 'Lyrics and duration are required' },
        { status: 400 }
      )
    }

    console.log(`Regenerating scenes for ${duration}s with lyrics length: ${lyrics.length}`)

    const scenes = await generateScenes(lyrics, duration)

    return NextResponse.json({ scenes })
  } catch (error: any) {
    console.error('Scene regeneration error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate scenes' },
      { status: 500 }
    )
  }
}
