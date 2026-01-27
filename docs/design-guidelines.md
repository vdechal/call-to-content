Great—here comes your `design-guidelines.md`, fully aligned with the uploaded `design-tips.md`.


````markdown
## design-guidelines.md

### ✨ Emotional Tone

**Feels like a confident strategist’s desk—decisive, energizing, and intelligent.**  
Catchy should make users feel powerful, fast, and ready to lead. Every interaction affirms their expertise.

---

### 🔤 Typography

| Style     | Font            | Use Case                          | Notes                               |
|-----------|------------------|-----------------------------------|--------------------------------------|
| H1        | Satoshi Black / Inter Bold | Page titles, CTAs              | Bold and commanding                  |
| H2        | Satoshi Semibold / Inter Semibold | Section headers         | Slightly softer for flow             |
| H3–Body   | Geist / Inter Regular     | Body text, insights             | Clean, neutral, easy to scan         |
| Caption   | Geist Mono / Thin Sans    | Insight tags, AI labels         | Clear hierarchy + slight “tech” feel |

- Modular scale with consistent rhythm
- Line-height ≥ 1.5× for all text
- Maintain type contrast without overwhelming (bold headers, quiet body)

---

### 🎨 Color System

```md
#1A1A1A — Primary (Deep Charcoal): Authority  
#FF5C38 — Accent (Vibrant Orange): Energy, CTA  
#F9F9F9 — Background (Warm Light Gray): Neutral canvas  

#26C281 — Success  
#2D9CDB — Info  
#F2994A — Warning  
#EB5757 — Error
````

* Use orange sparingly to create visual *punch*, not noise
* Stick to monochrome + accent for clarity and speed
* Maintain ≥ 4.5:1 contrast across light/dark modes

---

### 📐 Spacing & Layout

* 8pt grid system throughout
* Vertical rhythm reinforced by type scale
* Spacious top-level sections; tighter post editor
* Dashboard uses card-based layout
* Post editor uses tabbed UI with insight-to-draft flow
* Responsive: mobile-first design with full functionality

---

### 🎞 Motion & Interaction

* CTA buttons: hover pulse (confidence cue)
* Transitions: spring-based (250–300ms) for AI actions
* Insight reveal: fade-in one by one (builds anticipation)
* On error: gentle shake or color change, not scolding
* Empty states: encouraging, with small illustrative hints

**Interaction tone:** progression, momentum, and reassurance

---

### 🗣 Voice & Tone

* **Personality:** Confident, supportive, editorial
* **Microcopy principles:**

  * Clear over clever
  * No fluff, no filler
  * Use command tone for actions (“Upload a call”)
  * Encourage ownership (“Your insights, your posts”)

#### Microcopy Examples

* **Onboarding CTA:** “One call. Five posts. Zero writing blocks.”
* **Post ready status:** “Built from your words—no fluff.”
* **Error message:** “Didn’t catch that—try again or upload a new file.”

---

### ♻️ System Consistency

* Insight tags (e.g. “Breakthrough”, “Pain Point”) use color chips that repeat across transcript, post drafts, and dashboard
* Maintain shared card layouts between Dashboard and Post Editor
* Tabbed layout and motion rules mirror shadcn/ui patterns
* Icon use is minimal—typography leads the interface

---

### ♿ Accessibility

* Contrast ≥ 4.5:1 for all text and UI states

* Full keyboard navigation for upload, editor, and export

* ARIA roles:

  * Audio upload dropzone
  * Insight tags
  * Draft status messages

* Focus indicators styled with subtle but visible border glows

* Status text (e.g. “Analyzing insights…”) also exposed to screen readers

---

### ✅ Emotional Audit Checklist

* Does this interface evoke confidence and clarity?
* Do transitions feel like forward movement, not distraction?
* Would a time-starved user feel *energized*, not overwhelmed?
* Does error handling feel respectful, not robotic?
* Do visual choices support the strategist narrative?

---

### 🔧 Technical QA Checklist

* Typography scale aligns with 8pt rhythm
* All text + semantic colors meet WCAG AA+
* Interactive states include focus, hover, and loading feedback
* Motion durations = 250–300ms max unless cinematic
* No layout shifts between states (prevent cognitive dissonance)

---

### 🧠 Adaptive System Memory

If repurposing styles from other Lovable products:

* Want to retain your **vibrant orange accent** from Catchy?
* Reuse tabbed post layout across future team-focused tools?
* Consider extending the “quote tag” system into a full content taxonomy

---

### 📸 Design Snapshot Output

#### 🎨 Color Palette Preview

```md
Primary:   #1A1A1A  
Accent:    #FF5C38  
Background:#F9F9F9  
Success:   #26C281  
Info:      #2D9CDB  
Warning:   #F2994A  
Error:     #EB5757  
```

#### 🔠 Typographic Scale

| Style   | Size    | Weight     |
| ------- | ------- | ---------- |
| H1      | 36–40px | Bold/Black |
| H2      | 28–32px | Semibold   |
| Body    | 16–18px | Regular    |
| Caption | 12–14px | Mono/Light |

#### 📏 Spacing & Layout Summary

* 8pt grid system
* Top spacing: 48–64px
* Section padding: 24–32px
* Cards: 16–24px internal padding

#### 🧭 Emotional Thesis

**“Feels like a confident strategist’s desk—decisive, energizing, and intelligent.”**

---

### 🔍 Design Integrity Review

Catchy’s design system aligns tightly with its emotional goal: clarity and momentum. The bold typography, energetic accenting, and springy transitions all serve to make users feel in control—like expert communicators, not struggling writers. If anything, we could **soften error feedback further**—less red, more assistive tone—to maintain confidence under pressure.

```
