# JournalSing 🎵📄

**JournalSing** transforms complex scientific papers and academic journals into engaging, cinematic music videos using state-of-the-art AI from MiniMax.

## Features

- **📄 PDF Extraction**: Automatically extracts key insights and abstracts from uploaded research papers.
- **✍️ AI Lyrics**: Converts scientific text into catchy, structured song lyrics.
- **🎹 Pro Music Generation**: Uses **MiniMax Music-2.5** to compose high-quality audio tracks with clear vocals.
- **🎬 Cinematic Video**: Generates smooth transitions between AI-designed scenes using **MiniMax-Hailuo-02**.
- **👤 Character Consistency**: Uses **Image-to-Image (Subject Reference)** to ensure consistent visuals across the video.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & Framer Motion for animations
- **AI Core**: [MiniMax AI](https://platform.minimax.io/) (Music, Video, Image, and TTS APIs)
- **State Management**: Zustand

## Getting Started

### 1. Prerequisites

Obtain a MiniMax API Key from the [MiniMax Platform](https://platform.minimax.io/).

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
MINIMAX_API_KEY=your_api_key_here
```

### 3. Installation

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app/api`: Server-side routes for MiniMax integration.
- `/lib/api/minimax.ts`: Shared utility for MiniMax API calls.
- `/components/workflow`: Multi-step generation pipeline UI.
- `/types`: Comprehensive TypeScript definitions for the AI generation workflow.

## License

MIT
