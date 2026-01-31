import { NextRequest, NextResponse } from 'next/server'
import { minimax } from '@/lib/api/minimax'

export async function POST(request: NextRequest) {
  try {
    const { firstFrameImage, lastFrameImage, prompt, duration } = await request.json()

    if (!firstFrameImage || !lastFrameImage) {
      return NextResponse.json(
        { error: 'First and last frame images are required' },
        { status: 400 }
      )
    }

    // Determine resolution based on duration
    const resolution = duration === 10 ? '768P' : '1080P'

    const data = await minimax.generateVideo({
      first_frame_image: firstFrameImage,
      last_frame_image: lastFrameImage,
      prompt: prompt || '',
      duration: duration || 6,
      resolution,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Scene video generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate scene video' },
      { status: 500 }
    )
  }
}
