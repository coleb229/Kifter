---
name: nano-banana
description: "EXPLICIT ONLY — never auto-trigger. Generate UI mockups using Gemini CLI (nano-banana). Only invoke when the user explicitly calls /nano-banana. Args: 'generate <prompt>' or 'edit <file> <prompt>'."
---

# nano-banana — UI Mockup Generation via Gemini CLI

Generate visual UI mockups for Kifted features using the Gemini CLI image generation capabilities.

## Input Handling

Parse the argument after `/nano-banana`:

- **`generate <prompt>`**: Generate a new UI mockup from a text description
- **`edit <file> <prompt>`**: Edit an existing image with modifications

Examples:
- `/nano-banana generate fitness dashboard with macro rings and weight chart`
- `/nano-banana generate mobile food logging form with barcode scanner button`
- `/nano-banana edit ./nanobanana-output/dashboard.png add a dark mode variant`

## Setup

Before generating, export the API key:

```bash
export GEMINI_API_KEY=AIzaSyDmHKYKeUO_VvAnXw-fjgVr0Fz8
```

## Generate Command

```bash
gemini --yolo -p "/generate '<enhanced prompt>' --styles=modern,minimalist"
```

### Prompt Enhancement

Take the user's prompt and enhance it with Kifted's brand context:

**Always append these brand descriptors:**
- "fitness tracking PWA interface"
- "indigo/violet primary accent color, clean design"
- "mobile-first layout, card-based UI"
- "dark mode support, shadcn-style components"
- "athletic and confident aesthetic, not gamified, not corporate"
- "Geist font, rounded corners, subtle shadows"

**Viewport hints** (include in prompt text, NOT as flags):
- Mobile views: "portrait 9:16 mobile phone view, bottom navigation bar"
- Desktop views: "landscape 16:9 desktop view, sidebar navigation"
- Tablet views: "landscape 4:3 tablet view"

**IMPORTANT**: `--aspect-ratio` is NOT a valid Gemini CLI flag. Include aspect ratio descriptions in the prompt text instead.

### Examples

```bash
# Mobile workout logging
gemini --yolo -p "/generate 'Mobile phone portrait 9:16 view of a fitness workout logging screen, exercise name at top, sets/reps/weight input rows, rest timer button, indigo accent color, clean card-based layout, bottom navigation bar, athletic confident design, not gamified' --styles=modern,minimalist"

# Desktop body composition dashboard
gemini --yolo -p "/generate 'Desktop landscape 16:9 fitness body composition dashboard, weight trend chart on left, body measurements card on right, progress photo gallery below, indigo/violet accent, dark mode, clean shadcn-style components, athletic and confident' --styles=modern,minimalist"

# Diet logging form
gemini --yolo -p "/generate 'Mobile portrait 9:16 food logging form, search bar at top, recent foods chips, macro nutrient rings showing protein/carbs/fat, meal type selector, clean indigo accent, card-based, bottom navigation, athletic design' --styles=modern,minimalist"
```

## Edit Command

```bash
gemini --yolo -p "/edit '<file path>' '<modification prompt>'"
```

### Examples

```bash
gemini --yolo -p "/edit './nanobanana-output/dashboard.png' 'Switch to dark mode theme with dark gray background'"
gemini --yolo -p "/edit './nanobanana-output/workout.png' 'Add a floating action button in bottom right corner'"
```

## Output

- All generated images land in `./nanobanana-output/`
- After generation, read the output directory to find the new file(s)
- Display the file path(s) to the user
- Suggest descriptive renames if the auto-generated filename isn't clear

## Tips

- Gemini handles **layout and color** well but **text rendering poorly** — avoid text-heavy mockups
- Generate 2-3 variants to explore different approaches
- Include real-looking placeholder content (exercise names, macro values, dates) in prompts
- Reference specific Kifted UI elements: "stat cards with icon badges", "inline delete confirmation", "progress photo grid with hover overlay"
- Keep prompts under ~200 words for best results
