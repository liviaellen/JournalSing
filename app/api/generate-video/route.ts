import { NextRequest, NextResponse } from 'next/server'
import { minimax } from '@/lib/api/minimax'

// POST - Create video generation task
export async function POST(request: NextRequest) {
  try {
    const { prompt, firstFrameImage, lastFrameImage, duration, resolution } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const data = await minimax.generateVideo({
      prompt: prompt.slice(0, 2000),
      first_frame_image: firstFrameImage,
      last_frame_image: lastFrameImage,
      duration: duration || 6,
      resolution: resolution || '768P',
    })

    return NextResponse.json({
      taskId: data.task_id,
      status: 'processing',
    })
  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start video generation' },
      { status: 500 }
    )
  }
}

// GET - Query video generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const statusData = await minimax.queryVideoTask(taskId)

    // Map MiniMax status to our status
    let status: 'pending' | 'processing' | 'completed' | 'failed'
    switch (statusData.status) {
      case 'Preparing':
      case 'Queueing':
        status = 'pending'
        break
      case 'Processing':
        status = 'processing'
        break
      case 'Success':
        status = 'completed'
        break
      case 'Fail':
        status = 'failed'
        break
      default:
        status = 'processing'
    }

    // If completed, get the video file URL
    let videoUrl = null
    if (status === 'completed' && statusData.file_id) {
      const fileData = await minimax.retrieveFile(statusData.file_id)
      if (fileData.base_resp?.status_code === 0) {
        videoUrl = fileData.file?.download_url
      }
    }

    return NextResponse.json({
      status: status,
      videoUrl: videoUrl,
      width: statusData.video_width,
      height: statusData.video_height,
      error: status === 'failed' ? 'Video generation failed' : null,
    })
  } catch (error: any) {
    console.error('Video status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check video status' },
      { status: 500 }
    )
  }
}
