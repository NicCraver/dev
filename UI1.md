# AgentQL — Style Reference
> Deep space console: layered dark surfaces, focused luminosity.

**Theme:** dark

AgentQL employs a 'nebula console' aesthetic: deep, near-black backgrounds accented by vibrant, contained violet and blue glows. Content is presented on layered, softly lit cards with subtle depth, creating an immersive yet highly functional interface. Typography is primarily monochrome and robust, punctuated by a single clear blue for interactive elements and brand accents. The overall impression is one of sophisticated, focused productivity.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Gaze | `#0e111b` | `--color-midnight-gaze` | Primary background and base surface for cards and lists |
| Astral Deep | `#0d172b` | `--color-astral-deep` | Secondary background, often for action elements like buttons and deeper sections |
| Nebula Black | `#050606` | `--color-nebula-black` | Deepest shadow tint for subtle elevation and text effects |
| Crystal White | `#ffffff` | `--color-crystal-white` | Primary text, icons, and significant borders. Provides strong contrast against dark backgrounds |
| Lunar Dust | `#abaebb` | `--color-lunar-dust` | Secondary text, muted borders, and subtle navigation elements |
| Ash Outline | `#777a88` | `--color-ash-outline` | Outlined button borders and secondary interactive text |
| Comet Grey | `#c7c9d1` | `--color-comet-grey` | Subtle borders and minor text details |
| Twilight Indigo | `#12244f` | `--color-twilight-indigo` | Card backgrounds, providing a cooler, richer dark hue than the canvas |
| Cosmic Violet | `#1b346e` | `--color-cosmic-violet` | Card backgrounds, a slightly more saturated variant of Twilight Indigo |
| Starlight Violet | `#85a6e9` | `--color-starlight-violet` | Highlight card backgrounds, a luminous violet for emphasis |
| Etherium Blue | `#28b6ff` | `--color-etherium-blue` | Accent for code syntax, and decorative elements. Signifies active areas or syntax |
| Deep Space Glow | `radial-gradient(79.43% 95.88% at 38.94% -53.46%, rgba(98, 95, 255, 0.38) 0px, rgba(0, 0, 0, 0))` | `--color-deep-space-glow` | Subtle background glow or gradient start for prominent sections; Vivid brand accent for background effects. Dominant color: #625FFF |
| Pink Nova | `radial-gradient(27.99% 22.08% at 72.13% 103.46%, rgba(255, 125, 218, 0.33) 0px, rgba(0, 0, 0, 0))` | `--color-pink-nova` | Secondary brand accent for background effects. Dominant color: #FF7DDA |
| Frosty Glare | `linear-gradient(rgb(209, 211, 255) 35%, rgba(153, 157, 255, 0.1))` | `--color-frosty-glare` | Subtle background pattern or overlay, appearing as a soft, cool gradient from luminous white |

## Tokens — Typography

### Figtree — Used for prominent page headlines and key visual text. · `--font-figtree`
- **Substitute:** Montserrat
- **Weights:** 500, 600
- **Sizes:** 32px, 36px, 44px, 48px, 64px
- **Line height:** 1.00, 1.13
- **Letter spacing:** -0.0200em

### Inter — Versatile all-purpose typeface for body text, navigation, buttons, and most UI elements. · `--font-inter`
- **Substitute:** Inter
- **Weights:** 300, 400, 500, 600
- **Sizes:** 9px, 12px, 13px, 14px, 15px, 16px, 18px, 20px, 28px, 40px
- **Line height:** 1.00, 1.13, 1.25, 1.38, 1.50
- **Letter spacing:** -0.0400em, -0.0270em, -0.0230em, -0.0200em, 0.0200em

### IBM Plex Mono — Dedicated to code blocks and technical snippets. · `--font-ibm-plex-mono`
- **Substitute:** JetBrains Mono
- **Weights:** 400
- **Sizes:** 13px

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| heading-sm | 20px | 1.25 | -0.027px | `--text-heading-sm` |
| heading | 28px | 1.25 | -0.023px | `--text-heading` |
| heading-lg | 40px | 1.13 | -0.02px | `--text-heading-lg` |
| display | 64px | 1 | -0.02px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

### Border Radius

| Element | Value |
|---------|-------|
| cards | 12px |
| badges | 9999px |
| inputs | 8px |
| modals | 12px |
| buttons | 9999px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| md | `rgba(0, 0, 0, 0.2) 0px 3px 16px 0px` | `--shadow-md` |
| xl | `rgba(0, 0, 0, 0.5) 0px 4px 30px 0px` | `--shadow-xl` |
| xl-2 | `rgba(0, 0, 0, 0.34) 0px 20px 35px 0px, rgba(0, 0, 0, 0.25) 0px 4px 13px 0px` | `--shadow-xl-2` |
| md-2 | `rgba(255, 255, 255, 0.35) 0px 2px 14px 0px` | `--shadow-md-2` |
| xl-3 | `rgba(0, 0, 0, 0.35) 0px 20px 34px 0px` | `--shadow-xl-3` |
| subtle | `rgba(0, 0, 0, 0.15) 0px 0px 0px 1px` | `--shadow-subtle` |

### Layout

- **Page max-width:** 1408px
- **Section gap:** 104px
- **Card padding:** 16px
- **Element gap:** 4px

## Components

### Primary Ghost Button
backgroundColor: transparent, color: #abaebb, border: 1px solid #abaebb, borderRadius: 9999px, padding: 8px 12px. Inter 400.

### Filled Secondary Button
backgroundColor: #0d172b, text: #8798c1, border: 1px solid #172540, borderRadius: 4px.

### Elevated Content Card
backgroundColor: #0e111b, borderRadius: 12px, boxShadow: rgba(0, 0, 0, 0.5) 0px 4px 30px 0px, padding: 24px. Headings: Figtree; body: Inter.

### Nav Link Pill
transparent bg, color #abaebb, border 1px solid #abaebb, borderRadius 9999px, padding 8px 12px.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Page Canvas | `#0b0c0e` | Deepest page background |
| 1 | Base Surface | `#0e111b` | Main content and standard cards |
| 2 | Elevated Surface | `#0d172b` | Prominent sections / interactive areas |
| 3 | Accent Card Surface | `#12244f` | Highlighted features |

## Do's and Don'ts

### Do
- Use Figtree for primary headings with -0.02em letter-spacing
- Layer content on Midnight Gaze, Astral Deep, Twilight Indigo
- Use Crystal White for primary text
- Use 9999px radius for buttons and badges
- Use brand shadow tokens for elevation
- Reserve Etherium Blue for code, syntax highlights, decorative accents

### Don't
- Avoid bright uncontained colors on large areas
- No hard corners below 8px (12px cards, 9999px buttons)
- Avoid generic box-shadows
- Don't clutter layouts

## Quick Start — CSS Custom Properties

```css
:root {
  --color-midnight-gaze: #0e111b;
  --color-astral-deep: #0d172b;
  --color-nebula-black: #050606;
  --color-crystal-white: #ffffff;
  --color-lunar-dust: #abaebb;
  --color-ash-outline: #777a88;
  --color-comet-grey: #c7c9d1;
  --color-twilight-indigo: #12244f;
  --color-cosmic-violet: #1b346e;
  --color-starlight-violet: #85a6e9;
  --color-etherium-blue: #28b6ff;
  --color-violet-edge: #172540;
  --gradient-deep-space-glow: radial-gradient(79.43% 95.88% at 38.94% -53.46%, rgba(98, 95, 255, 0.38) 0px, rgba(0, 0, 0, 0));
  --gradient-pink-nova: radial-gradient(27.99% 22.08% at 72.13% 103.46%, rgba(255, 125, 218, 0.33) 0px, rgba(0, 0, 0, 0));

  --font-figtree: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-ibm-plex-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --radius-cards: 12px;
  --radius-badges: 9999px;
  --radius-inputs: 8px;
  --radius-buttons: 9999px;

  --shadow-md: rgba(0, 0, 0, 0.2) 0px 3px 16px 0px;
  --shadow-xl: rgba(0, 0, 0, 0.5) 0px 4px 30px 0px;
  --shadow-xl-2: rgba(0, 0, 0, 0.34) 0px 20px 35px 0px, rgba(0, 0, 0, 0.25) 0px 4px 13px 0px;

  --surface-page-canvas: #0b0c0e;
  --surface-base-surface: #0e111b;
  --surface-elevated-surface: #0d172b;
  --surface-accent-card-surface: #12244f;
}
```
