'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useJournalSingStore } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { generateFullContent, condenseConcept } from '@/lib/api/generation'

export function PDFDropzone() {
  const [isUploading, setIsUploading] = useState(false)
  const isGenerating = useJournalSingStore(state => state.isGenerating)
  const setIsGenerating = useJournalSingStore(state => state.setIsGenerating)
  const document = useJournalSingStore(state => state.document)
  const setDocument = useJournalSingStore(state => state.setDocument)
  const setLyrics = useJournalSingStore(state => state.setLyrics)
  const setScenes = useJournalSingStore(state => state.setScenes)
  const setProgress = useJournalSingStore(state => state.setProgress)
  const progress = useJournalSingStore(state => state.progress)
  const setCondensedText = useJournalSingStore(state => state.setCondensedText)
  const videoDuration = useJournalSingStore(state => state.videoDuration)
  const setVideoDuration = useJournalSingStore(state => state.setVideoDuration)
  const setRunId = useJournalSingStore(state => state.setRunId)

  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isGenerating) return
      const file = acceptedFiles[0]
      if (!file) return

      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        })
        return
      }

      setIsUploading(true)
      setIsGenerating(true)
      const newRunId = `run_${Date.now()}`
      setRunId(newRunId)

      try {
        // ... previous extraction steps ...
        const reader = new FileReader()
        // ... (keeping implementation)
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.readAsDataURL(file)
        })
        const base64Content = await base64Promise

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to extract PDF')
        const data = await response.json()

        setDocument({
          title: data.title || file.name.replace('.pdf', ''),
          text: data.text,
          pageCount: data.pageCount,
          fileName: file.name,
        })

        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({
            runId: newRunId, type: 'original', content: base64Content, filename: file.name, isBase64: true
          })
        })
        await fetch('/api/save-result', {
          method: 'POST',
          body: JSON.stringify({ runId: newRunId, type: 'parse_doc', content: data.text, filename: 'parse_doc.txt' })
        })

        try {
          setProgress({ step: 'extracting', progress: 30, message: 'Condensing concepts...' })
          const condensed = await condenseConcept(data.text)
          setCondensedText(condensed)

          setProgress({ step: 'generating-lyrics', progress: 60, message: 'Creating ELI5 song & storyboard...' })
          const { lyrics, scenes } = await generateFullContent(condensed, videoDuration)

          setLyrics(lyrics)
          setScenes(scenes)

          await fetch('/api/save-result', {
            method: 'POST',
            body: JSON.stringify({ runId: newRunId, type: 'lyric', content: lyrics.text, filename: 'lyric.txt' })
          })
          await fetch('/api/save-result', {
            method: 'POST',
            body: JSON.stringify({ runId: newRunId, type: 'storyboard', content: JSON.stringify(scenes, null, 2), filename: 'storyboard.txt' })
          })

          setProgress({ step: 'idle', progress: 100, message: 'Ready!' })
          toast({ title: 'JournalSing ready!', description: `Generated content for ${file.name}` })
        } catch (genError) {
          console.error('Generation Error:', genError)
          toast({ title: 'Generation partial', description: 'Check your lyrics and storyboard.', variant: 'destructive' })
        }
      } catch (error) {
        toast({ title: 'Upload failed', description: 'Failed to process PDF.', variant: 'destructive' })
      } finally {
        setIsUploading(false)
        setIsGenerating(false)
      }
    },
    [setDocument, toast, videoDuration, setLyrics, setScenes, setProgress, setCondensedText, setRunId, setIsGenerating]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  const handleRemove = () => {
    setDocument(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Transform Your Research</h2>
        <p className="text-muted-foreground">
          Upload a paper and choose your transformation style
        </p>
      </div>

      <div className="flex gap-4 items-center justify-center p-4 bg-muted/30 rounded-xl">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Video Duration</span>
          <div className="flex bg-background rounded-lg p-1 border">
            {[30, 60, 90].map((d) => (
              <Button
                key={d}
                variant={videoDuration === d ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVideoDuration(d)}
                className="h-8 px-4"
              >
                {d}s
              </Button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!document ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              {...getRootProps()}
              className={`
                relative p-12 border-2 border-dashed rounded-2xl
                transition-all duration-300 cursor-pointer
                ${isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
                ${isUploading ? 'pointer-events-none opacity-70' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                {isUploading ? (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <motion.div
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                    animate={{ y: isDragActive ? -5 : 0 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Upload className="w-8 h-8 text-primary" />
                  </motion.div>
                )}
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {isUploading
                      ? 'Extracting text...'
                      : isDragActive
                        ? 'Drop your PDF here'
                        : 'Drag & drop your PDF here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isUploading
                      ? 'Please wait while we process your document'
                      : 'or click to browse files'}
                  </p>
                </div>
              </div>
              {/* Animated border gradient */}
              {isDragActive && (
                <div className="absolute inset-0 rounded-2xl animated-border pointer-events-none" />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {document.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {document.fileName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{document.pageCount} pages</span>
                      <span>•</span>
                      <span>
                        {document.text.split(/\s+/).length.toLocaleString()} words
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemove}
                    className="flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Text preview */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                  <p className="text-sm text-muted-foreground line-clamp-6">
                    {document.text.slice(0, 500)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isUploading && (
        <div className="mt-8 space-y-4 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-primary font-medium">{progress.message}</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground italic">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI is composing and storyboarding...</span>
          </div>
        </div>
      )}
    </div>
  )
}
