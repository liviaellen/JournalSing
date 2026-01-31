import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const data = await pdf(buffer)

    // Extract title from the first line or use filename
    const lines = data.text.split('\n').filter((line: string) => line.trim())
    let title = file.name.replace('.pdf', '')

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim()
      if (line.length > 10 && line.length < 200 && !line.includes('@') && !line.includes('http')) {
        title = line
        break
      }
    }

    return NextResponse.json({
      text: data.text,
      title: title,
      pageCount: data.numpages,
      info: data.info,
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from PDF' },
      { status: 500 }
    )
  }
}
