import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), 'results', ...params.path)

    // Check if file exists
    await stat(filePath)

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type
    const ext = path.extname(filePath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf'
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: any) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}
