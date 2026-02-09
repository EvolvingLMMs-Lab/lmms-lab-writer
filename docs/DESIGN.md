# LMMs-Lab Writer - Design System

## Design Philosophy

**"Retro-Terminal Fintech"** — Blending pixel-perfect terminal aesthetics with modern minimalism. Data-centric, technical, and professional.

**Inspiration:** RECORD by High Output — real-time data dashboards featuring monospace typography and orange accents.

---

## Color Palette

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#f5f5f0` | Page background (warm light gray) |
| `foreground` | `#000000` | Primary text |
| `accent` | `#ff5500` | Primary accent (vibrant orange) |
| `accent-muted` | `#ff8c4a` | Hover states, secondary accent |
| `surface` | `#000000` | Badges, pills, dark containers |
| `surface-text` | `#ffffff` | Text on dark surfaces |
| `muted` | `#666666` | Secondary text |
| `border` | `#e5e5e5` | Subtle borders |
| `border-dark` | `#000000` | Strong borders |

### Usage Rules

1. **Orange is the sole accent color** — No blues, greens, or reds for UI elements.
2. **Black and white for structure** — Backgrounds, text, and borders.
3. **Orange for emphasis** — Highlights, active states, CTAs, and headlines.
4. **Warm gray background** — Slightly warmer than pure gray (#f5f5f0).

---

## Typography

### Font Stack

```css
/* Primary - Monospace/Pixel for data and body */
--font-mono: 'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', monospace;

/* Headlines - Clean sans-serif */
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;
```

### Type Scale

| Element | Font | Size | Weight | Style |
|---------|------|------|--------|-------|
| Hero headline | Sans | 4xl-7xl | Bold | Normal |
| Section headline | Sans | 2xl-3xl | Bold | Normal |
| Body text | Mono | base | Normal | Normal |
| Data/Numbers | Mono | lg-xl | Medium | Normal |
| Labels | Mono | sm | Medium | Uppercase |
| Status badges | Mono | xs-sm | Medium | Uppercase |

### Typography Rules

1. **Monospace for data** — Numbers, stats, lists, code, and timestamps.
2. **Sans-serif for headlines** — Marketing copy and section titles.
3. **Uppercase for labels** — Status indicators, categories, and tags.
4. **Orange for important headlines** — Hero text and key stats.
5. **Tight tracking** — `tracking-tight` on headlines.

---

## UI Components

### Buttons

```
Primary (Orange):
- bg-accent text-white
- hover:bg-accent-muted
- Sharp corners (no rounded)
- px-6 py-3
- font-mono uppercase tracking-wide

Secondary (Black):
- bg-foreground text-white
- hover:bg-muted
- Sharp corners
- px-6 py-3
- font-mono uppercase tracking-wide

Ghost:
- border border-border
- hover:bg-accent hover:text-white hover:border-accent
- Sharp corners
```

### Badges / Pills

```
Status Badge (Dark):
- bg-foreground text-white
- px-4 py-2
- font-mono text-sm uppercase tracking-wider
- Sharp corners

Highlight Badge (Orange):
- bg-accent text-white
- Same specs as dark badge
- Used for active/selected states
```

### Cards / Containers

```
Default Card:
- bg-background
- border border-border
- No shadow
- Sharp corners
- p-6

Dark Card:
- bg-foreground text-white
- No border needed
- Sharp corners
- p-6 font-mono
```

### Lists

```
Data List:
- Monospace font throughout
- + prefix for items (terminal style)
- Orange highlight bar for active/selected item
- Clear left-alignment
- Generous line-height (1.75)

Example:
+ $42.18    SPOTIFY US - TRACK 07
+ $31.64    [HIGHLIGHTED] APPLE MUSIC US - TRACK 12
+ $1,250.00 SYNC LICENSE - LOS ANGELES, CA
```

### Form Inputs

```
Text Input:
- border border-border
- focus:border-accent focus:ring-1 focus:ring-accent
- Sharp corners
- font-mono
- px-4 py-3
- placeholder:text-muted
```

---

## Layout Patterns

### Header

```
- Fixed top
- bg-foreground (dark) or bg-background with border-b
- Logo left, nav right
- Sharp corners on all elements
- Monospace for nav items
```

### Data Dashboard

```
- Light warm gray background
- Black pill badges for labels/status
- Orange headline for primary metric
- Monospace data tables
- + prefix for transaction/list items
- Orange bar highlight for selected rows
```

### Hero Section

```
- Large orange headline (4xl-7xl)
- Monospace body text
- Black/Orange CTAs side by side
- Data visualization or stats below
```

---

## Iconography

### Style

- Line icons (stroke-based)
- 1.5px stroke weight
- Square line caps and joins (not round)
- Monochrome (black or white)

### Usage

```
- Use sparingly
- Icons accompany text, never alone for critical actions
- aria-hidden="true" for decorative
- aria-label for functional buttons
```

---

## Motion / Animation

### Principles

1. **Minimal** — Prefer instant state changes.
2. **Functional** — Only animate to provide feedback.
3. **Fast** — 150ms max for micro-interactions.

### Allowed Animations

```css
/* Color transitions only */
transition-colors duration-150

/* Opacity for fade in/out */
transition-opacity duration-150

/* No transform animations for UI elements */
```

---

## Spacing Scale

Use Tailwind's default scale with these common patterns:

| Context | Spacing |
|---------|---------|
| Component padding | `p-4` to `p-6` |
| Section padding | `py-12` to `py-24` |
| Gap in flex/grid | `gap-4` to `gap-8` |
| Text margin | `mb-2` to `mb-4` |
| Container max-width | `max-w-6xl` |

---

## Do's and Don'ts

### Do

- Use monospace fonts for data, numbers, and body text.
- Use orange as the single accent color.
- Keep corners sharp (no rounded corners).
- Use black pill badges for status/labels.
- Use uppercase for labels and status text.
- Highlight selected items with orange background.
- Use warm gray (#f5f5f0) for page backgrounds.

### Don't

- Use multiple accent colors.
- Add rounded corners (`rounded-*`).
- Use shadows for elevation.
- Mix multiple font families in data.
- Use colored icons.
- Add decorative gradients.
- Use thin/light font weights for data.

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: '#f5f5f0',
        foreground: '#000000',
        accent: '#ff5500',
        'accent-muted': '#ff8c4a',
        surface: '#000000',
        'surface-text': '#ffffff',
        muted: '#666666',
        'muted-foreground': '#999999',
        border: '#e5e5e5',
        'border-dark': '#000000',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
}
```

---

## Component Examples

### Hero Section

```tsx
<section className="bg-background py-24">
  <div className="max-w-6xl mx-auto px-6">
    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-accent">
      Write LaTeX,
      <br />
      Together.
    </h1>
    <p className="mt-8 text-xl font-mono text-muted leading-relaxed max-w-2xl">
      A modern collaborative LaTeX editor. Write locally with our CLI,
      sync to the cloud, and collaborate in real-time.
    </p>
    <div className="mt-12 flex gap-4">
      <button className="bg-accent text-white px-6 py-3 font-mono uppercase tracking-wide hover:bg-accent-muted transition-colors">
        Start Writing
      </button>
      <button className="bg-foreground text-white px-6 py-3 font-mono uppercase tracking-wide hover:bg-muted transition-colors">
        Documentation
      </button>
    </div>
  </div>
</section>
```

### Status Badge Row

```tsx
<div className="flex gap-4">
  <div className="bg-foreground text-white px-4 py-2 font-mono text-sm uppercase tracking-wider">
    Updated 00:02 ago
  </div>
  <div className="bg-foreground text-white px-4 py-2 font-mono text-sm uppercase tracking-wider">
    Total: $14,382.17
  </div>
</div>
```

### Data List with Highlight

```tsx
<ul className="font-mono text-lg">
  <li className="flex gap-8 py-2">
    <span className="text-muted">+</span>
    <span>$42.18</span>
    <span>SPOTIFY US - TRACK 07</span>
  </li>
  <li className="flex gap-8 py-2 bg-accent text-white -mx-4 px-4">
    <span>+</span>
    <span>$31.64</span>
    <span>APPLE MUSIC US - TRACK 12</span>
  </li>
  <li className="flex gap-8 py-2">
    <span className="text-muted">+</span>
    <span>$1,250.00</span>
    <span>SYNC LICENSE - LOS ANGELES, CA</span>
  </li>
</ul>
```