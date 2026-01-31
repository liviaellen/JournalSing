export function extractTitle(text: string): string {
  // Try to extract title from first few lines
  const lines = text.split('\n').filter(line => line.trim())

  // Usually the title is in the first line or two
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim()
    // Skip lines that look like headers/metadata
    if (line.length > 10 && line.length < 200 && !line.includes('@') && !line.includes('http')) {
      return line
    }
  }

  return 'Untitled Document'
}

export function extractKeyPhrases(text: string): string[] {
  // Simple extraction of potential key phrases
  // In a real app, you might use NLP services
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20)
  const keywords: string[] = []

  // Look for phrases that might be important
  sentences.forEach(sentence => {
    const trimmed = sentence.trim()
    if (trimmed.includes('conclude') ||
        trimmed.includes('important') ||
        trimmed.includes('significant') ||
        trimmed.includes('result') ||
        trimmed.includes('finding')) {
      keywords.push(trimmed)
    }
  })

  return keywords.slice(0, 5)
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

export function getEstimatedDuration(wordCount: number, wordsPerMinute = 150): string {
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  if (minutes < 1) return 'Less than 1 min'
  if (minutes === 1) return '1 min'
  return `${minutes} mins`
}
