### 🧱 Step-by-Step Build Sequence

### Phase 1: Core Foundations (Week 1–2)

- [ ]  Set up project repo (monorepo: frontend + backend)
- [ ]  Install and configure Tailwind, shadcn/ui, Vite, TypeScript
- [ ]  Set up auth (email/password + magic link fallback)
- [ ]  Set up Lovable Cloud storage bucket for audio uploads
- [ ]  Create basic dashboard shell with routing + nav

### Phase 2: Transcription Workflow (Week 2–3)

- [ ]  Build drag-and-drop + file picker component
- [ ]  Upload pipeline: audio → Lovable Cloud → trigger backend
- [ ]  Integrate transcription API (Lovable or external fallback)
- [ ]  Display live transcription progress + speaker tags
- [ ]  Save transcript to DB with linked recording ID

### Phase 3: Insight Extraction & Tagging (Week 3–4)

- [ ]  Define initial insight schema (Quote, Tension, Solution, Proof)
- [ ]  Implement AI labeling (use fallback to rule-based if needed)
- [ ]  Highlight insights in transcript UI (timeline markers or color-coded)
- [ ]  Link extracted insights to their original timestamps

### Phase 4: AI Post Generation (Week 4–5)

- [ ]  Prompt tuning: Generate post drafts per insight type
- [ ]  Build multi-draft view with regenerate + tone edit tools
- [ ]  Implement “Make it punchier” and other inline tone tweaks
- [ ]  Add export / copy to clipboard button
- [ ]  Save edited versions with versioning

### Phase 5: UX Polish + Error Handling (Week 5–6)

- [ ]  Add system feedback: “Analyzing”, “Post ready”, etc.
- [ ]  Handle upload errors, transcript failures gracefully
- [ ]  Ensure full keyboard nav + ARIA roles (accessibility baseline)
- [ ]  Add motion transitions (spring-based) and hover pulses

### Phase 6: MVP Launch Prep (Week 6–7)

- [ ]  Seed demo data + one-click upload for new users
- [ ]  Create onboarding tooltip walkthrough (or skip-first design)
- [ ]  Test mobile views and tighten layout
- [ ]  Write launch announcement content
- [ ]  Deploy to production (Lovable hosting)

---

### ⏱ Timeline With Checkpoints

| Week | Milestone |
| --- | --- |
| 1 | Project setup + dashboard shell |
| 2 | Audio upload → transcription |
| 3 | Insight extraction live |
| 4 | Draft generation + editor |
| 5 | Tone tools + polish |
| 6 | Onboarding + mobile QA |
| 7 | 🎉 MVP launch |

---

### 👥 Team Roles & Rituals

- **Product Lead / Founder**
    - Owns tone, insight labels, user testing
- **Frontend Dev**
    - React components, shadcn/ui integration, transitions
- **Backend Dev**
    - Upload + transcription pipeline, insight storage
- **Prompt Engineer (Optional early)**
    - Optimizes insight extraction and post generation quality
- **Weekly Rituals**
    - Monday: 20-min priority planning
    - Friday: Ship review + 1 guerrilla test (recorded)
- **Monthly**
    - Run 3-user usability tests with full recording flow

---

### 🧩 Optional Integrations & Stretch Goals

- [ ]  Google OAuth login
- [ ]  LinkedIn Scheduler integration
- [ ]  Voice profile tuning from user’s past posts
- [ ]  “Magic Upload”: auto-capture from Zoom/Meet
- [ ]  Notion/Slack post export
- [ ]  Zapier trigger: “New post draft created”
