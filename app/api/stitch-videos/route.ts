import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { sceneVideos, musicUrl, outputFilename } = await request.json()

    if (!sceneVideos || sceneVideos.length === 0) {
      return NextResponse.json(
        { error: 'Scene videos are required' },
        { status: 400 }
      )
    }

    console.log(`Stitching ${sceneVideos.length} scene videos with music...`)

    // Create temp directory for processing
    const tempDir = tmpdir()
    const timestamp = Date.now()

    // Download all scene videos
    const videoFiles: string[] = []
    for (let i = 0; i < sceneVideos.length; i++) {
      const videoUrl = sceneVideos[i]
      if (!videoUrl) continue // Skip missing videos

      const videoPath = path.join(tempDir, `scene_${i}_${timestamp}.mp4`)
      const response = await fetch(videoUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      await writeFile(videoPath, buffer)
      videoFiles.push(videoPath)
    }

    if (videoFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid scene videos to stitch' },
        { status: 400 }
      )
    }

    // Create concat file for ffmpeg
    const concatFilePath = path.join(tempDir, `concat_${timestamp}.txt`)
    const concatContent = videoFiles.map(f => `file '${f}'`).join('\n')
    await writeFile(concatFilePath, concatContent)

    // Output paths
    const videoOnlyPath = path.join(tempDir, `video_only_${timestamp}.mp4`)
    const finalOutputPath = path.join(tempDir, `final_${timestamp}.mp4`)

    // Step 1: Concatenate all scene videos
    await execAsync(
      `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${videoOnlyPath}"`
    )

    // Step 2: Add music if provided
    let finalPath = videoOnlyPath
    if (musicUrl) {
      const musicPath = path.join(tempDir, `music_${timestamp}.mp3`)
      const musicResponse = await fetch(musicUrl)
      const musicBuffer = Buffer.from(await musicResponse.arrayBuffer())
      await writeFile(musicPath, musicBuffer)

      // Combine video with music
      await execAsync(
        `ffmpeg -i "${videoOnlyPath}" -i "${musicPath}" -c:v copy -c:a aac -shortest "${finalOutputPath}"`
      )
      finalPath = finalOutputPath

      // Cleanup music file
      await unlink(musicPath)
    }

    // Read final video
    const finalBuffer = await require('fs/promises').readFile(finalPath)
    const base64Video = finalBuffer.toString('base64')

    // Cleanup temp files
    await unlink(concatFilePath)
    for (const file of videoFiles) {
      await unlink(file)
    }
    if (finalPath !== videoOnlyPath) {
      await unlink(videoOnlyPath)
    }
    await unlink(finalPath)

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${base64Video}`,
      filename: outputFilename || 'final_video.mp4'
    })
  } catch (error: any) {
    console.error('Video stitching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stitch videos' },
      { status: 500 }
    )
  }
}
