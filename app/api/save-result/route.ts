import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { runId, type, content, filename } = await request.json()

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 })
    }

    const resultsDir = path.join(process.cwd(), 'results', runId)
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    const filePath = path.join(resultsDir, filename || `${type}.txt`)

    if (type === 'music' || type === 'video') {
      // Handle URL downloads
      const response = await fetch(content)
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(filePath, buffer)
    } else {
      // Handle text content
      fs.writeFileSync(filePath, content)
    }

    return NextResponse.json({ success: true, path: filePath })
  } catch (error: any) {
    console.error('Save result error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
