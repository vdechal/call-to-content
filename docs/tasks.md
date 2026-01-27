# Catchy - Implementation Tasks

> **Source of Truth** for feature implementation order and technical specifications.
> Updated: 2026-01-27

---

## Technical Decisions

| Decision | Choice |
|----------|--------|
| **Transcription API** | OpenAI Whisper via Lovable AI |
| **AI Engine** | Lovable AI (Gemini/GPT-5 gateway) |
| **Authentication** | Email/password only (MVP) |
| **Speaker Diarization** | Essential for MVP |
| **Upload Limits** | 60 min / 100MB max |

---

## Phase 1: Core Foundations (Week 1-2)

### Task 1.1: Enable Lovable Cloud ✅
- [ ] **1.1.1** Enable Lovable Cloud backend
- [ ] **1.1.2** Verify database, auth, storage, and edge functions are available

**Verification:** Cloud tab shows active status with all features enabled.

---

### Task 1.2: Database Schema Setup
> Reference: [masterplan.md](./masterplan.md) → Conceptual Data Model

#### 1.2.1 Create Users Profile Table
```sql
-- profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

#### 1.2.2 Create Recordings Table
```sql
-- recordings table
create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  file_path text not null,
  file_size bigint,
  duration_seconds integer,
  status text default 'uploading' check (status in ('uploading', 'transcribing', 'analyzing', 'ready', 'failed')),
  transcript_text text,
  speaker_segments jsonb, -- Array of {speaker, start, end, text}
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.recordings enable row level security;

-- RLS Policies
create policy "Users can view own recordings"
  on public.recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert own recordings"
  on public.recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recordings"
  on public.recordings for update
  using (auth.uid() = user_id);

create policy "Users can delete own recordings"
  on public.recordings for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index recordings_user_id_idx on public.recordings(user_id);
create index recordings_status_idx on public.recordings(status);
```

#### 1.2.3 Create Insights Table
```sql
-- insight_type enum
create type public.insight_type as enum ('quote', 'pain_point', 'solution', 'proof');

-- insights table
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references public.recordings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type insight_type not null,
  text text not null,
  speaker text, -- Speaker label from diarization
  start_time decimal, -- Timestamp in seconds
  end_time decimal,
  confidence decimal, -- AI confidence score 0-1
  is_starred boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.insights enable row level security;

-- RLS Policies
create policy "Users can view own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own insights"
  on public.insights for update
  using (auth.uid() = user_id);

create policy "Users can delete own insights"
  on public.insights for delete
  using (auth.uid() = user_id);

-- Indexes
create index insights_recording_id_idx on public.insights(recording_id);
create index insights_type_idx on public.insights(type);
```

#### 1.2.4 Create Post Drafts Table
```sql
-- post_drafts table
create table public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid references public.insights(id) on delete cascade not null,
  recording_id uuid references public.recordings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  tone text default 'original' check (tone in ('original', 'punchier', 'conversational', 'professional', 'storytelling')),
  version integer default 1,
  is_edited boolean default false,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.post_drafts enable row level security;

-- RLS Policies
create policy "Users can view own drafts"
  on public.post_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert own drafts"
  on public.post_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drafts"
  on public.post_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete own drafts"
  on public.post_drafts for delete
  using (auth.uid() = user_id);

-- Indexes
create index post_drafts_insight_id_idx on public.post_drafts(insight_id);
create index post_drafts_recording_id_idx on public.post_drafts(recording_id);
```

**Verification:** All tables visible in Cloud > Database > Tables with RLS enabled.

---

### Task 1.3: Storage Bucket Setup

#### 1.3.1 Create Audio Uploads Bucket
```sql
-- Create bucket for audio files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  104857600, -- 100MB limit
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/webm', 'audio/ogg']
);

-- RLS: Users can upload to their own folder
create policy "Users can upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: Users can view own recordings
create policy "Users can view own recordings"
  on storage.objects for select
  using (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: Users can delete own recordings
create policy "Users can delete own recordings"
  on storage.objects for delete
  using (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

**File naming convention:** `{user_id}/{recording_id}/{filename}`

**Verification:** Bucket visible in Cloud > Storage with correct policies.

---

### Task 1.4: Authentication Implementation
> Reference: [app-flow-pages-and-roles.md](./app-flow-pages-and-roles.md)

#### 1.4.1 Auth Context & Provider
Create `src/contexts/AuthContext.tsx`:
- `useAuth()` hook exposing user, session, loading states
- `signUp(email, password)` function
- `signIn(email, password)` function  
- `signOut()` function
- Auto-redirect based on auth state

#### 1.4.2 Protected Route Component
Create `src/components/auth/ProtectedRoute.tsx`:
- Wrap dashboard and editor routes
- Redirect to `/login` if not authenticated
- Show loading state during auth check

#### 1.4.3 Update Login Page
Update `src/pages/Login.tsx`:
- Connect to Supabase auth
- Handle signup/login errors with toast notifications
- Redirect to dashboard on success

#### 1.4.4 Update Navbar
Update `src/components/layout/Navbar.tsx`:
- Show user email/avatar when logged in
- Show logout button
- Show login/signup when logged out

**Verification:** 
- Can create account with email/password
- Can login and see dashboard
- Cannot access /dashboard without login
- Logout clears session

---

## Phase 2: Transcription Workflow (Week 2-3)

### Task 2.1: File Upload Pipeline

#### 2.1.1 Update UploadZone Component
Update `src/components/dashboard/UploadZone.tsx`:
- Real file upload to Supabase Storage
- Progress tracking with percentage
- File validation (type, size ≤100MB)
- Create recording record in database
- Handle upload errors gracefully

```typescript
// Upload flow:
// 1. Validate file type and size
// 2. Create recording record with status='uploading'
// 3. Upload to storage: recordings/{user_id}/{recording_id}/{filename}
// 4. Update recording with file_path
// 5. Trigger transcription edge function
// 6. Update UI with real-time status
```

#### 2.1.2 Real-time Status Updates
- Subscribe to recording status changes using Supabase Realtime
- Update TranscriptCard components automatically
- Show progress: uploading → transcribing → analyzing → ready

---

### Task 2.2: Transcription Edge Function

#### 2.2.1 Create Transcription Function
Create `supabase/functions/transcribe/index.ts`:

```typescript
// Edge function flow:
// 1. Receive recording_id
// 2. Fetch audio file from storage
// 3. Call Lovable AI with Whisper model
// 4. Parse transcript with speaker segments
// 5. Update recording with transcript_text and speaker_segments
// 6. Update status to 'analyzing'
// 7. Trigger insight extraction

// Speaker segments format:
interface SpeakerSegment {
  speaker: string; // "Speaker 1", "Speaker 2"
  start: number;   // seconds
  end: number;     // seconds
  text: string;
}
```

#### 2.2.2 Whisper API Integration via Lovable AI
```typescript
// Use Lovable AI gateway for Whisper
const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "multipart/form-data"
  },
  body: formData // Contains audio file
});
```

**Note:** If Whisper endpoint not available via gateway, use chunked approach:
1. Convert audio to text segments using speech-to-text
2. Use Lovable AI chat to identify speakers and segment transcript

---

### Task 2.3: Transcript Display

#### 2.3.1 Create Transcript Viewer Component
Create `src/components/transcript/TranscriptViewer.tsx`:
- Display full transcript with speaker labels
- Color-code different speakers
- Highlight extracted insights inline
- Click insight to jump to that section
- Show timestamps

#### 2.3.2 Update Dashboard TranscriptCard
- Show insight count badge
- Show "View Transcript" action
- Quick preview of first insight

---

## Phase 3: Insight Extraction (Week 3-4)

### Task 3.1: AI Insight Extraction

#### 3.1.1 Create Extraction Edge Function
Create `supabase/functions/extract-insights/index.ts`:

```typescript
// System prompt for insight extraction:
const EXTRACTION_PROMPT = `
You are an expert content strategist analyzing a client call transcript.
Identify and extract the following types of insights:

1. QUOTE - Memorable, quotable statements that show expertise
2. PAIN_POINT - Client frustrations, challenges, or problems mentioned
3. SOLUTION - Strategies, methods, or approaches discussed
4. PROOF - Results, metrics, case studies, or social proof

For each insight, provide:
- type: quote | pain_point | solution | proof
- text: The exact or paraphrased content (1-3 sentences)
- speaker: Which speaker said this
- start_time: Approximate timestamp in seconds
- confidence: Your confidence score 0-1

Return as JSON array. Extract 5-15 insights per call.
`;

// Use structured output with tool calling
body.tools = [{
  type: "function",
  function: {
    name: "extract_insights",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["quote", "pain_point", "solution", "proof"] },
              text: { type: "string" },
              speaker: { type: "string" },
              start_time: { type: "number" },
              confidence: { type: "number" }
            },
            required: ["type", "text", "speaker", "confidence"]
          }
        }
      }
    }
  }
}];
```

#### 3.1.2 Store Extracted Insights
- Insert insights into `insights` table
- Link to recording and user
- Update recording status to 'ready'

---

### Task 3.2: Insight Display in Editor

#### 3.2.1 Update Editor Page
Update `src/pages/Editor.tsx`:
- Fetch real insights from database
- Replace mock data with actual recording data
- Show insight type badges with correct colors
- Enable starring/favoriting insights

#### 3.2.2 Insight Type Color System
```typescript
// Consistent across transcript viewer, editor, and dashboard
const insightColors = {
  quote: 'bg-info/10 text-info border-info/20',
  pain_point: 'bg-warning/10 text-warning border-warning/20', 
  solution: 'bg-success/10 text-success border-success/20',
  proof: 'bg-accent/10 text-accent border-accent/20'
};
```

---

## Phase 4: AI Post Generation (Week 4-5)

### Task 4.1: Post Generation Edge Function

#### 4.1.1 Create Generation Function
Create `supabase/functions/generate-posts/index.ts`:

```typescript
// System prompt for post generation:
const GENERATION_PROMPT = `
You are a LinkedIn ghostwriter for marketing agency owners.
Transform this insight into a compelling LinkedIn post.

Voice guidelines:
- Confident and strategic, never salesy
- Short paragraphs (1-2 sentences max)
- Use line breaks for readability
- Start with a hook that stops the scroll
- End with a call-to-action or thought-provoker
- 150-300 words ideal

Tone options:
- original: Balanced, professional but personable
- punchier: Short sentences, bold claims, high energy
- conversational: Casual, story-driven, relatable
- professional: Formal, data-focused, authoritative
- storytelling: Narrative arc, personal anecdotes

Generate the post in the requested tone.
`;

// Input: insight text, insight type, requested tone
// Output: Post content string
```

#### 4.1.2 Generate Multiple Drafts
- On insight extraction complete, auto-generate 3 drafts per insight
- Use different tones: original, punchier, storytelling
- Store in post_drafts table

---

### Task 4.2: Post Editor Interface

#### 4.2.1 Multi-Draft View
Update `src/pages/Editor.tsx`:
- Tab for each tone variant
- Side-by-side comparison option
- Mark favorite draft
- Character count display

#### 4.2.2 Inline Editing
- Contenteditable post content
- Auto-save on blur
- Mark as edited when modified
- Preserve version history

#### 4.2.3 Tone Adjustment Tools
Create `src/components/editor/ToneAdjuster.tsx`:
- "Make it punchier" button → regenerate with punchier tone
- "Make it conversational" → regenerate with conversational tone
- Custom instruction input for specific changes

#### 4.2.4 Regenerate from Insight
- "Try again" button on any draft
- Uses same insight, generates new content
- Increments version number

---

### Task 4.3: Export & Copy

#### 4.3.1 Copy to Clipboard
- One-click copy button
- Show toast confirmation
- Track copy events for analytics

#### 4.3.2 Export Options (Future)
- Export as text file
- (V1) Direct post to LinkedIn via API

---

## Phase 5: UX Polish & Error Handling (Week 5-6)

### Task 5.1: Loading States & Feedback

#### 5.1.1 Status Messages
> Reference: [design-guidelines.md](./design-guidelines.md) → Voice & Microcopy

```typescript
const statusMessages = {
  uploading: "Uploading your call...",
  transcribing: "Listening carefully...",
  analyzing: "Extracting the gold...",
  generating: "Crafting your posts...",
  ready: "Built from your words—no fluff."
};
```

#### 5.1.2 Progress Indicators
- Upload: percentage bar
- Transcription: pulse animation with timer
- Analysis: insight count ticker
- Generation: spring-in for each draft

#### 5.1.3 Error States
- Friendly error messages (not technical)
- Retry actions where applicable
- Contact support link for persistent failures

---

### Task 5.2: Accessibility Audit

#### 5.2.1 Keyboard Navigation
- Tab through upload zone, transcript, insights, drafts
- Enter to activate buttons
- Escape to close modals

#### 5.2.2 ARIA Labels
- Upload zone: `aria-label="Upload audio file"`
- Insight tags: `aria-label="Quote insight"`
- Status updates: `aria-live="polite"`

#### 5.2.3 Contrast Check
- Verify all text meets 4.5:1 ratio
- Test insight colors on light/dark backgrounds

---

### Task 5.3: Mobile Optimization

#### 5.3.1 Responsive Layouts
- Dashboard: single column on mobile
- Editor: stacked panels (transcript → insights → drafts)
- Swipe gestures for draft navigation

#### 5.3.2 Touch Targets
- Minimum 44x44px for all buttons
- Adequate spacing between interactive elements

---

## Phase 6: MVP Launch Prep (Week 6-7)

### Task 6.1: Demo Data & Onboarding

#### 6.1.1 Sample Recording
- Pre-load demo call transcript for new users
- Show as "Example: Discovery Call"
- Already has insights and drafts generated

#### 6.1.2 Onboarding Flow
- Welcome modal on first login
- Highlight key features with tooltips
- CTA: "Upload your first call"

---

### Task 6.2: Testing & QA

#### 6.2.1 Unit Tests
- Auth flows (signup, login, logout)
- File upload validation
- Insight extraction parsing
- Post generation formatting

#### 6.2.2 E2E Tests
- Full flow: upload → transcribe → extract → generate → copy
- Error scenarios: large file, invalid format, network failure

---

### Task 6.3: Production Deployment

#### 6.3.1 Environment Check
- [ ] All secrets configured in Cloud
- [ ] RLS policies verified
- [ ] Storage bucket policies verified
- [ ] Edge functions deployed

#### 6.3.2 Publish
- [ ] Deploy to production
- [ ] Verify custom domain (if applicable)
- [ ] Monitor error logs

---

## File Structure Reference

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── UploadZone.tsx
│   │   └── TranscriptCard.tsx
│   ├── editor/
│   │   ├── InsightCard.tsx
│   │   ├── PostDraftCard.tsx
│   │   ├── ToneAdjuster.tsx
│   │   └── TranscriptPanel.tsx
│   ├── transcript/
│   │   └── TranscriptViewer.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── BenefitsSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   └── CTASection.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/ (shadcn components)
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useRecordings.ts
│   ├── useInsights.ts
│   └── usePostDrafts.ts
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Editor.tsx
└── types/
    └── database.ts

supabase/
├── config.toml
├── functions/
│   ├── transcribe/
│   │   └── index.ts
│   ├── extract-insights/
│   │   └── index.ts
│   └── generate-posts/
│       └── index.ts
└── migrations/
    ├── 001_profiles.sql
    ├── 002_recordings.sql
    ├── 003_insights.sql
    └── 004_post_drafts.sql
```

---

## Progress Tracking

| Phase | Status | Start | Complete |
|-------|--------|-------|----------|
| Phase 1: Foundations | 🔲 Not Started | - | - |
| Phase 2: Transcription | 🔲 Not Started | - | - |
| Phase 3: Insight Extraction | 🔲 Not Started | - | - |
| Phase 4: Post Generation | 🔲 Not Started | - | - |
| Phase 5: UX Polish | 🔲 Not Started | - | - |
| Phase 6: Launch Prep | 🔲 Not Started | - | - |

---

## Quick Reference

**Design Tokens:** See [design-guidelines.md](./design-guidelines.md)
**User Journeys:** See [app-flow-pages-and-roles.md](./app-flow-pages-and-roles.md)
**Product Vision:** See [masterplan.md](./masterplan.md)
**Build Sequence:** See [implementation-plan.md](./implementation-plan.md)
