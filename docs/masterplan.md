### 🚀 30-Second Elevator Pitch

**Catchy** is a content automation platform for agency owners and consultants who speak brilliance on client calls—but struggle to turn it into LinkedIn content. With just one upload, Catchy transcribes, extracts key insights, and drafts multiple ready-to-post ideas, all in your voice. It’s like having a ghostwriter and strategist in your back pocket.

---

### ❗ Problem & Mission

### Problem

High-value conversations are wasted daily. Consultants and agencies spend hours on calls but lack the time or system to repurpose those insights into content that builds authority.

### Mission

To empower marketing professionals to turn their words into influence—automatically, confidently, and without ever staring at a blank page again.

---

### 🎯 Target Audience

- Agency owners building personal or client brands on LinkedIn
- Solo consultants and service providers who think out loud
- Social media teams inside agencies repurposing recorded calls at scale

---

### 🧩 Core Features

- **Call Upload & Transcription**
    - Drag-and-drop or file picker
    - Speaker-tagged transcripts in real-time
- **Smart Insight Extraction**
    - Auto-labels: Quote, Pain Point, Proof, Breakthrough
    - Tension-mapping for emotional hooks
- **AI Post Generator**
    - Multiple drafts per call
    - Edit tone (“Make it punchier”), regenerate from insight
    - Copy/export to clipboard (LinkedIn scheduling coming soon)
- **Dashboard**
    - History of uploads and post drafts
    - Status updates: “Analyzing insights”, “Post ready”
- **Authentication**
    - Email/password with optional magic link
- **Future Hooks**
    - LinkedIn scheduler
    - Voice profile training from past posts
    - Team mode for agency collaboration

---

### 🧱 High-Level Tech Stack

- **Frontend:** React + TypeScript + Tailwind (via shadcn/ui)
→ Fast, flexible, and matches Catchy’s bold aesthetic
- **Backend + Storage:** Lovable Cloud
→ Rapid prototyping with built-in support for audio, text, and AI workflows
- **Auth:** Email/password + optional magic link
→ Simple but scalable for future team plans

---

### 🗂 Conceptual Data Model (ERD in Words)

- **User**
    - id, email, password_hash, role (solo/team)
- **Recording**
    - id, user_id, filename, status, transcription_text, speaker_tags
- **Insight**
    - id, recording_id, type (quote, proof, tension), text, timestamp
- **PostDraft**
    - id, insight_id, version, tone, content, is_edited
- **Team (future)**
    - id, name, members[], permissions[]

---

### ✨ UI Design Principles

- **Krug-style clarity:** Every action should feel obvious—no tooltips required.
- **Energy-first interfaces:** Bold headlines, vibrant accents, forward momentum through motion.
- **Minimal friction:** Smart defaults, minimal setup, clear progress indicators.
- **Emotionally intelligent AI:** Suggestions should feel collaborative, never random or robotic.

---

### 🔐 Security & Compliance Notes

- Transcripts and insights stored per user; no cross-account sharing without consent.
- Audio and post data encrypted at rest.
- Admin dashboard for manual deletion requests and GDPR compliance.
- Future roadmap: team role-based permissions and SOC 2 Lite alignment.

---

### 🗺️ Phased Roadmap

### 🛠 MVP

- Upload + transcription
- Insight labeling (manual fallback if AI fails)
- 3 draft styles per insight
- Simple editor + copy/export

### 🚀 V1

- Voice-aware NLP
- Tone tweaking tools
- Insight-driven post regeneration
- LinkedIn scheduling (lightweight)

### 🧠 V2+

- Voice profile learning (adapts to past posts)
- Team accounts
- Comment-to-content: AI turns client comments into posts

---

### ⚠️ Risks & Mitigations

- **Risk:** AI misses key insights → Manual tagging fallback
- **Risk:** Users mistrust AI tone → Tone sliders + “regenerate” from same insight
- **Risk:** Low adoption post-onboarding → Embed instant value with “One call, Five posts” demo upload

---

### 🌱 Future Expansion Ideas

- Browser extension to capture Zoom/Meet calls automatically
- Client-facing “review portal” for post approvals
- Branded content reports: “Your month in content”
- Custom AI tone training for personal brand alignment
