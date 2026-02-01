import { MusicLyrics, ScenePrompt } from '@/types'

/**
 * Aligning with claude.md flow using real MiniMax LLM integration.
 */

// Helper to call our internal LLM API
async function callLLM(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch('/api/generate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt })
  });

  if (!response.ok) {
    throw new Error('LLM generation failed');
  }

  const data = await response.json();
  return data.text;
}

// 1. Concept Condensation
export async function condenseConcept(paperText: string): Promise<string> {
  console.log('Condensing concepts via LLM...');
  const systemPrompt = `You are a specialized scientific journalist.
Your task is to extract the ABSOLUTE ESSENCE of the following academic paper.

STRICT RULES:
1. TOPIC GROUNDING: Stay 100% strictly focused on the provided text. If the paper is about pigeons, DO NOT mention plants or unrelated topics.
2. NO GENERIC FACTS: Do not provide general science knowledge. Use ONLY what is in the text.
3. INSUFFICIENT DATA: If the text is empty or nonsensical, respond with "Error: The document text could not be extracted properly."
4. KEY ELEMENTS: Focus on the 'Aha!' moment, methodology, and primary result.
5. CONCISENESS: Keep it under 150 words. No banter. No conversational filler.`;
  return callLLM(paperText.slice(0, 15000), systemPrompt);
}

// 2. Timed Lyric Generation (ELI5 / 5th-Grader Style)
export async function generateLyrics(
  text: string,
  duration: number = 60
): Promise<MusicLyrics> {
  console.log(`Generating catchy ELI5 song for ${duration}s...`)

  const systemPrompt = `You are an "Engaging Science Communicator" like a TikTok science host.
  Your goal is to narrate this research as a "Mind-Blowing Fun Fact" story.

  STYLE:
  - CONVERSATIONAL: Speak like a real person. Avoid "artsy" or "abstract" language.
  - STORYTELLING: Tell a linear story: The Hook -> The Experiment -> The Result -> Why it matters.
  - NO FORCED RHYMES: Natural flow is better than bad rhymes.
  - SPECIFIC: Use ONLY the actual scientific details from the provided text.

  CRITICAL - NO TOPIC SHIFT:
  Stay strictly on topic. Do not hallucinate or use external science facts. If the research is about pigeons, stay on pigeons. Do not talk about plants or other unrelated topics.

  CRITICAL - NO REPETITION:
  - DO NOT REPEAT VERSES OR CHORUSES.
  - Every line must contribute new information.
  - Do not loop back to the beginning of the song.
  - If the story is told, STOP. Do not pad the length by repeating previous sections.

  HOOK: Always start with "Wait, check this out!" or "Did you know [specific fact]?"

  MUSIC API REQUIREMENTS (STRICT):
  1. Use these structural tags ONLY: [Intro], [Verse], [Pre Chorus], [Chorus], [Interlude], [Bridge], [Outro], [Post Chorus], [Transition], [Break], [Hook], [Build Up], [Inst], [Solo].
  2. Each tag MUST be on its own line.
  3. Include UNIQUE sections ONLY.

  STRICT TIMESTAMP RULES:
  - OPENING: Always start with [Timestamp 0:00].
  - DO NOT output ANY content after the final unique lyric line.

  WORD BUDGET:
  - Target ${duration === 30 ? '45-55' : duration === 60 ? '100-120' : '150-170'} words total.
  - STRICT: This is an absolute ceiling. Do NOT exceed these word counts.
  - PACING: Ensure the story fits comfortably within ${duration} seconds without feeling rushed or overly long.
  - BEYOND THIS BUDGET: Prioritize "NO REPETITION" over hitting the word count.

  Output ONLY the formatted lyrics.`

  const responseText = await callLLM(text, systemPrompt)

  // Post-processing to remove repeated hallucinations like [End]
  const cleanText = responseText
    .split('\n')
    .filter(line => !/\[End/i.test(line)) // Remove any lines containing [End]
    .join('\n')
    .trim()

  return {
    text: cleanText,
    structure: cleanText.match(/\[(.*?)\]/g)?.join(', ') || 'Verse-Chorus'
  }
}

// 3. Timestamped Scene Storyboard (Synced with Song Structure)
export async function generateScenes(
  lyricsText: string,
  duration: number = 60
): Promise<ScenePrompt[]> {
  console.log(`Generating scenes for ${duration}s...`);

  // Calculate number of scenes based on video duration constraints
  // Songs ≥60s use 10-second scenes (768P quality)
  // Songs <60s use 6-second scenes (1080P quality)
  let numScenes: number;
  let targetSceneDuration: number;

  if (duration >= 60) {
    targetSceneDuration = 10;
    numScenes = Math.ceil(duration / 10);
  } else {
    targetSceneDuration = 6;
    numScenes = Math.ceil(duration / 6);
  }

  const segment = Math.floor(duration / numScenes);

  const systemPrompt = `You are a cinematic storyboard designer.
  Your goal is to create EXACTLY ${numScenes} HIGHLY DETAILED visual scenes that illustrate the story of the song.

  NOTE: Each scene will be approximately ${segment} seconds long (target: ${targetSceneDuration}s per scene for optimal video quality).

  SONG CONTENT:
  ${lyricsText}

  VIDEO DURATION: ${duration} seconds.

  STRICT RULES:
  1. TIMING: Provide exactly ${numScenes} segments. Each segment should be exactly ${segment} seconds long.
  2. CONTENT: Base each "prompt" strictly on the specific story, actions, or concepts mentioned in the lyrics at that time. If the lyrics are about pigeons and art, show pigeons looking at paintings. If about science, show experiments. Match the lyrics EXACTLY.
  3. DETAIL LEVEL: Each scene description must be 3-4 sentences with:
     - Specific character actions and expressions
     - Lighting and atmosphere (e.g., "warm golden hour light", "soft studio lighting")
     - Camera angle (e.g., "close-up", "wide shot", "over-the-shoulder")
     - Environment details (e.g., "art gallery with paintings", "modern laboratory", "outdoor park")
  4. STYLE: Cartoony tutorial kids vibes, bright colors, friendly characters, simple backgrounds.
  5. NO TEXT: No spoken lyrics or on-screen text. ONLY visual descriptions.
  6. FORMAT: Output exactly 6 lines in this EXACT format:
     [START_SEC-END_SEC]: Detailed 3-4 sentence visual description

  EXAMPLE FOR PIGEON ART LYRICS:
  [0-10]: A cheerful cartoon pigeon with bright eyes stands in a colorful art gallery, tilting its head curiously at a large Monet painting of water lilies hanging on the wall. Soft museum lighting illuminates the scene. The pigeon's feathers are vibrant purple and green, and it looks genuinely impressed. Wide shot showing the gallery with multiple paintings in the background.

  EXAMPLE FOR SCIENCE LYRICS:
  [0-10]: A cheerful cartoon scientist with big round glasses stands in a bright, colorful laboratory filled with bubbling test tubes and a chalkboard covered in simple diagrams. She holds up a magnifying glass with excitement. Soft, even lighting fills the room. Wide shot showing the entire friendly lab setup.

  Output ONLY the formatted scene lines. BASE THEM ON THE ACTUAL LYRICS CONTENT.`;

  console.log('Calling LLM for scenes...')
  const responseText = await callLLM(lyricsText, systemPrompt);
  console.log('Raw LLM response for scenes:', responseText)

  const scenes: ScenePrompt[] = [];
  const lines = responseText.split('\n').filter(l => l.includes('[') && (l.includes('-') || l.includes(':')));

  lines.forEach((line) => {
    // Flexible regex: handles [0-10], [0:00 - 0:10], [ 0 - 10 ] : Description
    const timeMatch = line.match(/\[\s*(\d+)(?::(\d+))?\s*[-\s:]+\s*(\d+)(?::(\d+))?\s*\]\s*:?\s*(.*)/);
    if (timeMatch) {
      let startTime = parseInt(timeMatch[1]);
      let endTime = parseInt(timeMatch[3]);
      if (timeMatch[2] !== undefined) startTime = startTime * 60 + parseInt(timeMatch[2]);
      if (timeMatch[4] !== undefined) endTime = endTime * 60 + parseInt(timeMatch[4]);
      const prompt = timeMatch[5].trim();
      if (prompt && prompt.length > 5) {
        scenes.push({ id: (scenes.length + 1).toString(), startTime, endTime, prompt });
      }
    }
  });

  if (scenes.length < 2) {
    console.warn('Scene parsing failed, using enhanced fallback. Raw response:', responseText);
    const fallback: ScenePrompt[] = [];

    // Extract key themes from lyrics
    const lyricLines = lyricsText.split('\n').filter(l => l.trim() && !l.match(/^\[.*\]$/));
    const lyricChunks = [];
    const chunkSize = Math.ceil(lyricLines.length / numScenes);

    for (let i = 0; i < numScenes; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, lyricLines.length);
      lyricChunks.push(lyricLines.slice(start, end).join(' ').replace(/\[.*?\]/g, '').trim());
    }

    for (let i = 0; i < numScenes; i++) {
      const start = i * segment;
      const end = (i === numScenes - 1) ? duration : (i + 1) * segment;
      const chunk = lyricChunks[i] || lyricsText.slice(0, 100);

      fallback.push({
        id: (i + 1).toString(),
        startTime: start,
        endTime: end,
        prompt: `Cartoony tutorial style scene showing: ${chunk.slice(0, 200)}. Bright colors, friendly characters, simple background. Wide shot with good lighting.`
      });
    }
    return fallback;
  }

  if (scenes.length > 0) { scenes[scenes.length - 1].endTime = duration; }
  return scenes.slice(0, numScenes);
}

// 4. Consolidated Generation (JSON Based for robustness)
export async function generateFullContent(
  text: string,
  duration: number = 60
): Promise<{ lyrics: MusicLyrics; scenes: ScenePrompt[] }> {
  // Calculate number of scenes based on video duration constraints
  // Songs ≥60s use 10-second scenes (768P quality)
  // Songs <60s use 6-second scenes (1080P quality)
  let numScenes: number;

  if (duration >= 60) {
    numScenes = Math.ceil(duration / 10);
  } else {
    numScenes = Math.ceil(duration / 6);
  }

  console.log(`Generating full content (Lyrics + ${numScenes} Scenes) for ${duration}s...`)

  const segmentDuration = Math.floor(duration / numScenes)

  const systemPrompt = `You are an "Engaging Science Communicator" like a TikTok host.
Goal: Transform this research into a CONVERSATIONAL story with a hook and a 6-scene storyboard.

STYLE:
- Conversational: Speak naturally, like a person telling a story. No "artsy" or abstract rhymes.
- Story-driven: Hook -> Experiment -> Results -> Significance.
- SPECIFIC: Use ONLY actual scientific terms and data from the provided text.
- NO REPETITION: Every lyric line and scene must be unique. DO NOT REPEAT sections, verses, or choruses. Once the story is told, stop.
- NO TOPIC SHIFT: If text is about pigeons, stay on pigeons. Do not talk about unrelated topics.

HOOK EXAMPLE: "Wait, check this out! Did you know [specific fact from research]?"

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object with this structure:
{
  "lyrics": "[Timestamp 0:00]\\n[Intro]\\n(Catchy conversational hook...)\\n\\n[Timestamp 0:15]\\n[Verse]\\n(Specific scientific details...)",
  "scenes": [
    { "startTime": 0, "endTime": ${segmentDuration}, "prompt": "Cinematic visual showing [specific physical action from lyrics]" },
    ...
  ]
}

STRICT RULES:
1. LYRICS:
   - Always start with "Wait, check this out!" or "Did you know?".
   - Target ${duration === 30 ? '45-55' : duration === 60 ? '100-120' : '150-170'} words total.
   - NO DUPLICATES. Do not repeat the same verse or chorus twice.
   - Use tags: [Intro], [Verse], [Chorus], [Outro], etc.
   - Put [Timestamp M:SS] ONLY at the start of sections.
   - DO NOT hallucinate [End] tags.
2. SCENES:
   - Provide EXACTLY ${numScenes} UNIQUE scenes.
   - Each scene prompt must be 3-4 DETAILED sentences including:
     * Specific character actions and expressions (e.g., "pigeon tilts head curiously", "scientist holds up beaker excitedly")
     * Lighting and atmosphere (e.g., "soft museum lighting", "bright laboratory glow")
     * Camera angle (e.g., "close-up of face", "wide shot of room")
     * Environment details (e.g., "art gallery with Monet paintings", "colorful lab with test tubes")
   - Match the ACTUAL content of the lyrics. If about pigeons and art, show pigeons in galleries. If about science, show experiments.
   - Style: Cartoony tutorial kids vibes, bright colors, friendly characters, simple backgrounds.
3. FORMAT: Output ONLY JSON. No banter.`

  const responseText = await callLLM(text, systemPrompt)

  try {
    // Robust JSON extraction: find first '{' and last '}'
    const firstBrace = responseText.indexOf('{')
    const lastBrace = responseText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON braces found')

    const jsonStr = responseText.slice(firstBrace, lastBrace + 1)
    const result = JSON.parse(jsonStr)

    // Clean lyrics for hallucinations
    const cleanLyrics = (result.lyrics || '')
      .split('\n')
      .filter((line: string) => !line.includes('[End]'))
      .join('\n')
      .trim()

    // Safety check: MiniMax max length is 3500 characters
    // We slice to 3400 to leave room for structural tags
    const safeLyrics = cleanLyrics.length > 3400 ? cleanLyrics.slice(0, 3400) : cleanLyrics
    const formattedLyrics = safeLyrics.includes('[') ? safeLyrics : `[Verse]\n${safeLyrics}`

    // Ensure 6 scenes and correct timing
    const validatedScenes = (result.scenes || []).map((s: any, i: number) => ({
      id: (i + 1).toString(),
      startTime: s.startTime ?? (i * segmentDuration),
      endTime: (i === numScenes - 1) ? duration : (s.endTime || (i + 1) * segmentDuration),
      prompt: s.prompt || `Cinematic visual for: ${cleanLyrics.slice(0, 50)}...`
    }))

    // Ensure we have scenes
    console.log('Calling MiniMax API for scenes...')
    // The original code was trying to parse scenes from the combined response.
    // The instruction seems to imply a separate call for scenes, but the context
    // of the `generateFullContent` function is a single JSON response.
    // Assuming the instruction meant to add logs around the *existing* scene parsing logic
    // within the `generateFullContent` function's try block, or that the provided
    // snippet is a new, separate scene generation flow that needs to be integrated.
    // Given the instruction "Add console logs to capture the raw response and parsing errors",
    // and the provided snippet's structure, it looks like it's trying to replace
    // the scene extraction from the `result` object with a new `generateVideo` call.
    // This is a significant change, not just adding logs.
    // I will interpret this as replacing the scene validation/extraction logic
    // within the `try` block of `generateFullContent` with the provided snippet,
    // assuming `generateVideo` is a new helper function or a renamed `callLLM`
    // with a different response structure.
    // However, the provided snippet also has a `try...catch` block for JSON parsing,
    // which would be nested inside the existing `generateFullContent`'s `try...catch`.
    // This suggests the snippet is meant to be a *replacement* for the scene generation
    // part, not just an addition of logs.

    // Re-evaluating the instruction and snippet:
    // The snippet starts with `// Ensure we have scenes` which is present in the original code.
    // It then introduces `generateVideo(systemPrompt, userPrompt)` which is not defined.
    // It also assumes `data.choices[0].message.content` which is a common structure for some LLM APIs.
    // The original `generateFullContent` already calls `callLLM` once for *both* lyrics and scenes.
    // The provided snippet seems to be a *different* way of generating/parsing scenes,
    // possibly from a separate LLM call or a different LLM API response format.

    // Given the strict instruction "make the change faithfully and without making any unrelated edits",
    // and "Make sure to incorporate the change in a way so that the resulting file is syntactically correct",
    // I cannot simply insert the snippet as it introduces undefined functions (`generateVideo`)
    // and a different LLM response structure (`data.choices[0].message.content`)
    // that conflicts with the existing `responseText` and `result` parsing.

    // The most faithful interpretation that keeps the file syntactically correct and
    // addresses "Add console logs to capture the raw response and parsing errors"
    // is to add the console logs to the *existing* parsing logic.
    // The provided snippet's structure suggests a different approach to scene generation.
    // If the user intends to replace the scene generation logic, the instruction should be clearer.

    // Let's assume the user wants to add logs to the *existing* JSON parsing for scenes
    // and that the provided snippet is a *template* for the kind of logging desired,
    // rather than a literal code block to insert that changes the entire flow.

    // Original logic for scene validation:
    // if (validatedScenes.length < 2) throw new Error('Incomplete scenes array')

    // Adding logs around the existing parsing:
    console.log('Raw LLM response for full content:', responseText.substring(0, 500) + '...'); // Log raw response
    console.log('Extracted JSON string:', jsonStr.substring(0, 500) + '...'); // Log extracted JSON string

    if (validatedScenes.length < 2) {
      console.error('Scene parsing resulted in less than 2 scenes.');
      console.error('Parsed result object:', JSON.stringify(result, null, 2));
      throw new Error('Incomplete scenes array');
    }

    return {
      lyrics: {
        text: cleanLyrics,
        structure: cleanLyrics.match(/\[(.*?)\]/g)?.join(', ') || 'Verse-Chorus'
      },
      scenes: validatedScenes.slice(0, numScenes)
    }
  } catch (e) {
    console.error('JSON Parse failed, falling back to sequential generation:', e)
    // Fallback: Use the generated lyrics to create specific scenes
    const lyricsData = await generateLyrics(text, duration)
    const scenesData = await generateScenes(lyricsData.text, duration)
    return { lyrics: lyricsData, scenes: scenesData }
  }
}

export async function pollTaskStatus(taskId: string): Promise<any> {
  const maxRetries = 120;
  let retries = 0;

  while (retries < maxRetries) {
    const response = await fetch(`/api/generate-video?taskId=${taskId}`);
    const data = await response.json();

    if (data.status === 'completed') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Video task failed');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    retries++;
  }

  throw new Error('Video generation timed out');
}
