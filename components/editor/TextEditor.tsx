'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Save, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJournalSingStore } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { getWordCount, getEstimatedDuration } from '@/lib/pdf'

export function TextEditor() {
  const { document, editedText, setEditedText } = useJournalSingStore()
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  const wordCount = getWordCount(editedText)
  const estimatedDuration = getEstimatedDuration(wordCount)

  const handleTextChange = (value: string) => {
    setEditedText(value)
    setHasChanges(value !== document?.text)
  }

  const handleReset = () => {
    if (document) {
      setEditedText(document.text)
      setHasChanges(false)
      toast({
        title: 'Text reset',
        description: 'The text has been restored to the original.',
      })
    }
  }

  const handleSave = () => {
    setHasChanges(false)
    toast({
      title: 'Changes saved',
      description: 'Your edits have been saved.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Edit Text</h2>
        <p className="text-muted-foreground">
          Review the extracted text and make any edits before generating audio
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main editor */}
        <motion.div
          className="md:col-span-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document?.title || 'Document'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Your extracted text will appear here..."
                className="min-h-[400px] font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats sidebar */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {wordCount.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Words</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Clock className="w-6 h-6 text-primary" />
                  {estimatedDuration}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated duration
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {document?.pageCount || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pages</p>
              </div>
            </CardContent>
          </Card>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary/20"
            >
              <p className="text-sm text-center text-primary">
                You have unsaved changes
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
