

# Task 2.2: Transcription Edge Function

## Overview

This task implements the core transcription pipeline that converts uploaded audio recordings into text with speaker identification. When a user uploads an audio file (Task 2.1), the system will automatically transcribe it using OpenAI Whisper via the Lovable AI gateway, identify different speakers, and update the recording with the full transcript and speaker segments.

---

## Implementation Flow

```text
+------------------+     +-------------------+     +------------------+
|  Client Upload   | --> |  Transcribe Edge  | --> |  Update Database |
|  (status:        |     |  Function         |     |  (status:        |
|   transcribing)  |     |                   |     |   analyzing)     |
+------------------+     +-------------------+     +------------------+
                                |
                                v
                         +-------------+
                         |  Lovable AI |
                         |  Gateway    |
                         |  (Whisper)  |
                         +-------------+
```

---

## Components to Create

### 1. Edge Function: `supabase/functions/transcribe/index.ts`

**Purpose**: Receives a recording ID, fetches the audio from storage, transcribes it via Lovable AI, and updates the database.

**Request Flow**:
1. Validate incoming request (requires `recording_id`)
2. Fetch recording metadata from database (validate ownership via service role)
3. Download audio file from Supabase Storage
4. Send audio to Lovable AI gateway for transcription
5. Parse response and extract speaker segments (using AI for diarization if needed)
6. Update recording with transcript_text, speaker_segments, and duration
7. Update status to `analyzing` (ready for insight extraction)
8. Return success response

**Key Features**:
- CORS headers for browser calls
- Service role authentication to bypass RLS for updates
- Error handling with status update to `failed`
- Logging sanitized for production (no raw error objects)

### 2. Client Trigger from `useRecordings.ts`

**Update**: After a successful file upload, call the transcribe edge function to initiate transcription.

---

## Technical Details

### Edge Function Structure

```text
supabase/functions/transcribe/
  index.ts        <- All code in single file
```

### API Design

**Endpoint**: `POST /functions/v1/transcribe`

**Request Body**:
```json
{
  "recording_id": "uuid-of-recording"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "recording_id": "uuid",
  "duration_seconds": 125,
  "segment_count": 15
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Transcription Strategy

The Lovable AI gateway supports OpenAI Whisper at:
`https://ai.gateway.lovable.dev/v1/audio/transcriptions`

**Whisper API Call**:
- Model: `whisper-1`
- Response format: `verbose_json` (includes timestamps)
- Language: auto-detect

**Speaker Diarization Approach**:
Since Whisper does not provide native speaker diarization, we will use a two-step process:
1. First call Whisper to get the raw transcript with timestamps
2. Then use Lovable AI chat (GPT-5 or Gemini) to analyze the transcript and identify likely speaker changes based on context, turn-taking patterns, and conversational cues

### Database Updates

**Recording table updates**:
- `transcript_text`: Full concatenated transcript
- `speaker_segments`: JSON array of speaker segments
- `duration_seconds`: Audio duration (from Whisper response or calculated)
- `status`: Updated to `analyzing` on success, `failed` on error
- `error_message`: Set on failure, cleared on success

### Speaker Segment Format

```typescript
interface SpeakerSegment {
  speaker: string;  // "Speaker 1", "Speaker 2", etc.
  start: number;    // Start time in seconds
  end: number;      // End time in seconds
  text: string;     // Transcript text for this segment
}
```

---

## Implementation Steps

### Step 1: Create the Edge Function

Create `supabase/functions/transcribe/index.ts` with:
- CORS headers configuration
- Request validation and parsing
- Supabase client initialization (service role)
- Audio file download from storage
- Lovable AI Whisper API call
- Speaker diarization via AI chat
- Database update logic
- Comprehensive error handling

### Step 2: Update Config.toml

Add the transcribe function configuration:
```toml
[functions.transcribe]
verify_jwt = false
```

### Step 3: Update `useRecordings.ts` Hook

Modify the upload mutation to:
- Call the transcribe edge function after successful file upload
- Handle transcription initiation errors gracefully
- Keep the optimistic "transcribing" status

### Step 4: Update Tasks Documentation

Mark Task 2.2 as completed with verification steps.

---

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Invalid recording_id | Return 400 with clear message |
| Recording not found | Return 404, update status if possible |
| Storage download fails | Return 500, set status to `failed` |
| Whisper API fails | Return 500, set status to `failed` with message |
| Speaker analysis fails | Fall back to single speaker, log warning |
| Database update fails | Return 500, log error |

---

## Security Considerations

1. **Service Role Key**: Used only server-side to bypass RLS for updates
2. **Logging Policy**: No raw error objects or recording IDs in production logs
3. **CORS**: Configured to allow browser requests with proper headers
4. **Input Validation**: Recording ID validated as UUID format
5. **Ownership**: Recording fetched with service role but user_id checked for sanity

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/transcribe/index.ts` | Create | Main transcription edge function |
| `supabase/config.toml` | Modify | Add transcribe function config |
| `src/hooks/useRecordings.ts` | Modify | Trigger transcription after upload |
| `docs/tasks.md` | Modify | Mark Task 2.2 as completed |

---

## Verification Steps

After implementation:
1. Upload an audio file from the dashboard
2. Check that the recording status changes from "uploading" to "transcribing"
3. View edge function logs to confirm transcription is running
4. Wait for completion and verify:
   - Status changes to "analyzing"
   - `transcript_text` is populated in the database
   - `speaker_segments` contains an array of segments
   - `duration_seconds` is set
5. Test error handling by uploading an invalid file format

---

## Dependencies

**Already Available**:
- `LOVABLE_API_KEY` secret (confirmed in project secrets)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets
- Recordings storage bucket with proper RLS

**External APIs**:
- Lovable AI Gateway: `https://ai.gateway.lovable.dev`
  - `/v1/audio/transcriptions` - Whisper transcription
  - `/v1/chat/completions` - Speaker diarization analysis

