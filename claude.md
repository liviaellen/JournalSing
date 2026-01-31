# 🎵 Paper-to-Music-Video Generator (Minimax)

## 1. Overview

A cloud-based system that converts an academic paper (PDF or raw text) into a **short educational music video** (default: 60 seconds).
The pipeline extracts content, generates lyrics and visual scenes, creates AI music and images with **Minimax**, assembles a video, and merges audio + visuals into a final MP4.

---

## 2. Goals & Non-Goals

### Goals
- Transform dense papers into engaging, short-form teaching videos
- Fully automated, end-to-end pipeline
- Configurable duration (e.g., 30s / 60s / 90s)
- Deterministic, time-aligned scenes and lyrics

### Non-Goals
- Full paper coverage
- Fine-grained manual editing
- Human-level art direction

---

## 3. User Inputs

| Input | Type | Description |
|---|---|---|
| Paper | PDF / Text | Academic paper or article |
| Video Duration | Integer (seconds) | Default: 60 |
| Style (optional) | Enum | Calm / Energetic / Cinematic |
| Output | Enum | MP4 (default) |

---

## 4. System Architecture

```
PDF / Raw Text
      ↓
Text Extraction
      ↓
Concept Condensation (≈3:1)
      ↓
┌─────────────────────────┐
│ Dual Generation Phase   │
│ 1) Lyrics               │
│ 2) Scene Timeline       │
└─────────────────────────┘
      ↓
Minimax Audio   Minimax Images
      ↓               ↓
└────── Video Assembly ──────┘
      ↓
Audio + Video Merge
      ↓
Final MP4
```

---

## 5. Pipeline Details

### 5.1 Text Extraction
- PDF → raw text
- Cleanup (references, equations)
- Chunking for LLM processing
**Output:** Clean raw text

### 5.2 Concept Condensation
- Identify core problem, method, insight
- Remove math-heavy details
**Output:** Short teaching narrative (≈3:1 compression)

### 5.3 Dual Text Generation

#### A) Lyrics
- Rhythmic, simple, educational
- Time-aligned to duration
**Output:** Structured lyrics (verses/chorus with timestamps)

#### B) Scene Timeline
- Deterministic scene plan
**Format Example:**
```
0–10s: Abstract network forming
11–20s: Nodes connecting
21–40s: Model learning
41–60s: Clear insight visualization
```

---

## 6. Media Generation (Minimax)

### 6.1 Audio
- Input: Lyrics + style
- Output: WAV/MP3, duration = video length

### 6.2 Images
- Input: Scene descriptions
- Output: Images per scene (keyframes)

### 6.3 Video Assembly
- Image → clip
- Transitions (fade/zoom/pan)
- Exact timing per scene
**Output:** Silent MP4

---

## 7. Composition

- Sync Minimax audio with video
- Render final MP4

---

## 8. Cloud Architecture

| Component | Tech |
|---|---|
| API | FastAPI |
| Storage | GCS / S3 |
| Workers | Cloud Run / K8s Jobs |
| LLM | Minimax |
| Video | FFmpeg |
| Queue | Pub/Sub / SQS |

**Job Flow**
1. Upload paper
2. Async generation job
3. Track stages (text → audio → video)
4. Notify on completion
5. Download MP4

---

## 9. Failure Handling

- PDF parse fail → manual text fallback
- Audio fail → simplified lyrics retry
- Image fail → reuse previous frame
- Video fail → partial scene recovery

---

## 10. MVP Scope

**Included**
- PDF → 60s video
- Single music + visual style
- MP4 output

**Excluded**
- Multi-language
- Subtitles
- Manual editor UI

---

## 11. Future Extensions

- Beat-synced cuts
- Subtitles
- More genres/styles
- Timeline editor
- Batch processing

---

## 12. Success Metrics

- Time-to-video < 5 min
- ≥90% successful jobs
- Duration accuracy ±0.5s
- Positive concept-retention feedback
