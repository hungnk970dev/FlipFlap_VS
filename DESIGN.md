---
name: Flip Flash
colors:
  surface: '#fff8f5'
  surface-dim: '#edd5ca'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ea'
  surface-container: '#ffeadf'
  surface-container-high: '#fbe4d7'
  surface-container-highest: '#f5ded2'
  on-surface: '#251912'
  on-surface-variant: '#584235'
  inverse-surface: '#3b2d26'
  inverse-on-surface: '#ffede5'
  outline: '#8c7263'
  outline-variant: '#e0c0af'
  surface-tint: '#994700'
  primary: '#994700'
  on-primary: '#ffffff'
  primary-container: '#ff7b00'
  on-primary-container: '#5d2900'
  inverse-primary: '#ffb68a'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#006397'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a9fd'
  on-tertiary-container: '#003b5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb68a'
  on-primary-fixed: '#321300'
  on-primary-fixed-variant: '#743500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#92ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#fff8f5'
  on-background: '#251912'
  surface-variant: '#f5ded2'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system embodies an energetic and encouraging learning environment. The brand personality is "The Supportive Coach"—high-energy, reliable, and deeply organized. It bridges the gap between educational rigor and playful interaction.

The design style is **Modern Tactile**. It utilizes clean, geometric foundations paired with soft depth effects to make digital flashcards feel physically interactable. Motion should be snappy and purposeful, emphasizing the "flip" action that defines the core user experience. The interface maintains high clarity to ensure students remain focused, using vibrant accents only to celebrate progress and provide immediate feedback.

## Colors

The palette is anchored by a high-visibility **Action Orange**, used to drive the user's eye toward primary interactions and progress indicators. 

- **Primary:** #FF7B00 (Orange) for CTA buttons, active navigation states, and the "filing" of mastered cards.
- **Surface (Light):** #FAFAFA (Off-white) provides a clean, paper-like canvas that reduces eye strain during long study sessions.
- **Surface (Dark):** #121212 (Deep Charcoal) maintains focus in low-light environments, with elevated surfaces using slightly lighter charcoal tones.
- **Feedback:** 
    - **Success (Got it):** Soft emerald green (#4ADE80) used for positive reinforcement and "mastered" indicators.
    - **Learning (Still Learning):** Soft sky blue (#60A5FA) used for "re-queue" actions, offering a calming alternative to traditional "error" reds to keep the tone encouraging.

## Typography

This design system utilizes **Montserrat** for its geometric friendliness and exceptional legibility across various weights. The type scale is generous to accommodate educational content that may range from single words to short paragraphs.

- **Headlines:** Use Bold (700) or SemiBold (600) weights. High-contrast sizing ensures clear hierarchy between deck titles and card content.
- **Body:** Card content uses `body-lg` to ensure readability from a distance or on smaller mobile screens.
- **Labels:** Use Medium (500) or SemiBold (600) in all-caps or title case for micro-copy, such as "Card X of Y" or category tags.

## Layout & Spacing

The layout follows a **Fluid Grid** model with an 8px base unit. 

- **Mobile:** A 4-column grid with 16px margins. Flashcards should occupy the full width of the safe area to maximize focus.
- **Desktop:** A 12-column centered grid with a maximum content width of 1200px. Sidebars for navigation and progress tracking should be collapsible to enter "Focus Mode."
- **Rhythm:** Use `lg` (24px) spacing between related cards in a list, and `xl` (48px) to separate distinct sections like "Active Decks" from "Recently Mastered."

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and tonal layering. 

- **Level 0 (Background):** The base off-white or charcoal surface.
- **Level 1 (Decks/Lists):** Subtle 1px borders with a very soft, large-radius shadow (0px 4px 20px rgba(0,0,0,0.05)) to suggest they are resting on the surface.
- **Level 2 (Active Flashcard):** Higher elevation with a more pronounced shadow (0px 8px 30px rgba(0,0,0,0.12)). This creates a "lifted" effect, signaling to the user that the card can be interacted with or flipped.
- **Dark Mode Adjustment:** Shadows should be darker and tighter, using a slight primary color tint (#FF7B00) at 5% opacity to maintain warmth in the dark theme.

## Shapes

The shape language is consistently **Rounded**, avoiding sharp edges to maintain a friendly, approachable aesthetic.

- **Flashcards:** Use `rounded-xl` (24px) to emphasize their role as physical-like objects.
- **Buttons & Inputs:** Use `rounded-lg` (16px) for a comfortable, "clicky" feel.
- **Selection Indicators:** Small indicators and chips use a full pill-shape to contrast against the rectangular cards.

## Components

### Flashcards
The hero component. On hover or tap, cards should exhibit a slight "lift" (y-axis shift). The flip animation must be a 3D transform. The back of the card should have a subtle textural difference, like a very light grid pattern, to distinguish it from the front.

### Buttons
- **Primary:** Solid #FF7B00 with white text. High-contrast and slightly oversized for easy tapping.
- **Feedback Buttons:** "Got It" (Green) and "Still Learning" (Blue) should be placed side-by-side at the bottom of the study view. They use semi-transparent backgrounds in their idle state and become solid on hover.

### Progress Bars
Used at the top of study sessions. The track is a light grey (or dark charcoal), while the fill is #FF7B00. Use a rounded pill-shape for the container.

### Theme Toggle
A clean, circular toggle located in the top-right navigation. Use smooth iconography (Sun/Moon) that rotates 90 degrees during the transition between modes.

### Chips & Tags
Small `rounded-xl` labels used for deck categories (e.g., "Biology", "Language"). These use low-saturation versions of the accent colors to keep the primary orange as the most dominant visual element.