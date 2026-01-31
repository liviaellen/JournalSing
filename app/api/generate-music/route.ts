import { NextRequest, NextResponse } from 'next/server'
import { minimax } from '@/lib/api/minimax'

export async function POST(request: NextRequest) {
  try {
    const { lyrics, genre, mood, tempo, prompt: userPrompt } = await request.json()

    if (!lyrics || lyrics.length < 1) {
      return NextResponse.json(
        { error: 'Lyrics are required' },
        { status: 400 }
      )
    }

    // Format lyrics: Strip [Timestamp] tags for Music API, but keep structural tags like [Verse]
    const cleanLyrics = lyrics.replace(/\[Timestamp\s+\d+:\d+\]/g, '').trim()

    // Safety check: MiniMax max length is 3500 characters
    // We slice to 3400 to leave room for structural tags
    const safeLyrics = cleanLyrics.length > 3400 ? cleanLyrics.slice(0, 3400) : cleanLyrics
    const formattedLyrics = safeLyrics.includes('[') ? safeLyrics : `[Verse]\n${safeLyrics}`

    // Improved prompt for music generation
    const musicPrompt = userPrompt || "Upbeat, educational tutorial song, clear vocals, professional pop style"

    const data = await minimax.generateMusic({
      lyrics: formattedLyrics,
      prompt: musicPrompt,
      output_format: 'url',
    })

    const audioUrl = data.data?.audio
    const duration = (data.extra_info?.music_duration || 0) / 1000 // Convert ms to seconds

    return NextResponse.json({
      url: audioUrl,
      duration: duration,
    })
  } catch (error: any) {
    console.error('Music generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate music' },
      { status: 500 }
    )
  }
}
