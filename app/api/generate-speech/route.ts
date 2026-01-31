import { NextRequest, NextResponse } from 'next/server'

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!MINIMAX_API_KEY) {
      return NextResponse.json(
        { error: 'MiniMax API key not configured' },
        { status: 500 }
      )
    }

    const { text, voiceId, speed, pitch } = await request.json()

    if (!text || text.length < 1) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // MiniMax T2A API
    const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-2.8-hd',
        text: text.slice(0, 10000), // Max 10,000 characters
        stream: false,
        language_boost: 'auto',
        output_format: 'url', // Get URL instead of hex for easier playback
        voice_setting: {
          voice_id: voiceId || 'English_Graceful_Lady',
          speed: speed || 1.0,
          vol: 1,
          pitch: Math.round(((pitch || 1.0) - 1) * 12), // Convert 0.5-2 to -12 to 12
        },
        audio_setting: {
          sample_rate: 44100,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MiniMax TTS error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.base_resp?.status_code !== 0) {
      console.error('MiniMax TTS error:', data.base_resp?.status_msg)
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'Failed to generate speech' },
        { status: 400 }
      )
    }

    // If output_format is 'url', the audio URL is in data.data.audio
    // If output_format is 'hex', we'd need to convert to base64
    const audioUrl = data.data?.audio
    const duration = (data.extra_info?.audio_length || 0) / 1000 // Convert ms to seconds

    return NextResponse.json({
      url: audioUrl,
      duration: duration,
    })
  } catch (error) {
    console.error('Speech generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
