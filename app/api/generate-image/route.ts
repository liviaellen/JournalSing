import { NextRequest, NextResponse } from 'next/server'
import { minimax } from '@/lib/api/minimax'

export async function POST(request: NextRequest) {
  try {
    const { prompt, subjectReference, aspectRatio, responseFormat, n } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const data = await minimax.generateImage({
      prompt,
      subject_reference: subjectReference,
      aspect_ratio: aspectRatio || '1:1',
      response_format: responseFormat || 'url',
      n: n || 1,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
