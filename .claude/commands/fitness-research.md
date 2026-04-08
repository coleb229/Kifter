---
name: fitness-research
description: "EXPLICIT ONLY — never auto-trigger. Research how other fitness apps handle a specific feature area using firecrawl web scraping. Only invoke when the user explicitly calls /fitness-research. Accepts a topic description."
---

# Fitness App Competitive Research

Research how leading fitness apps handle a specific feature area by scraping their public web pages, feature descriptions, and marketing content. Synthesizes findings into a structured comparison saved to `.claude/fitness-research/`.

## Input Handling

Parse the text after `/fitness-research` as the **research topic**:
- `/fitness-research body composition tracking`
- `/fitness-research food logging UX`
- `/fitness-research workout programming and periodization`
- `/fitness-research progress photos and body measurements`

## Target Apps

These are the primary competitors to research. Most are iOS-first apps, so research focuses on their **web marketing pages**, **feature descriptions**, **App Store screenshot galleries**, and **help docs/blogs**.

| App | Primary URL | Focus Area |
|---|---|---|
| MyFitnessPal | myfitnesspal.com | Food logging, macro tracking, barcode scanning |
| Strong | strong.app | Workout logging, exercise library, training history |
| Hevy | hevyapp.com | Training logs, social features, workout sharing |
| MacroFactor | macrofactorapp.com | Adaptive nutrition, expenditure tracking, body weight trends |
| Carbon Diet Coach | carbonapp.co | AI-driven diet coaching, macro adjustments |
| RP Hypertrophy | rpstrength.com/app | Periodization, volume tracking, muscle recovery |
| Fitbod | fitbod.me | AI workout generation, muscle group tracking |
| JEFIT | jefit.com | Exercise database, workout plans, body measurements |
| Cronometer | cronometer.com | Micronutrient tracking, biometrics |
| FatSecret | fatsecret.com | Food diary, recipe nutrition, community |

## Research Methodology

### Step 1: Discover relevant pages

For each app relevant to the topic, map their site structure:

```bash
firecrawl map <url> --search "<topic keywords>"
```

Focus on:
- Feature pages (e.g., `/features`, `/features/nutrition`)
- Help/support articles about the feature
- Blog posts explaining the feature
- Pricing pages (to understand feature tiers)

### Step 2: Scrape feature content

For the most relevant pages discovered:

```bash
firecrawl scrape <page-url>
```

Extract:
- Feature descriptions and capabilities
- Screenshots or image descriptions
- UX flow descriptions
- Pricing/tier gating for the feature
- Any unique differentiators

### Step 3: Search for additional context

Use firecrawl search for broader research:

```bash
firecrawl search "best <topic> fitness app features 2025"
firecrawl search "<app name> <topic> review"
```

### Step 4: Synthesize findings

Create a structured research summary at `.claude/fitness-research/<topic-slug>.md`:

```markdown
# Competitive Research: <Topic>
Date: <YYYY-MM-DD>

## Summary
<2-3 sentence overview of the competitive landscape for this feature>

## App-by-App Analysis

### <App Name>
- **What they do well**: ...
- **What they do poorly**: ...
- **Key features**: ...
- **Screenshots/visuals**: <descriptions of notable UI patterns>
- **Pricing tier**: Free / Premium ($X/mo)

### <Next App>
...

## Common Patterns
<What most apps get right — table stakes features Kifted must have>

## Differentiation Opportunities
<Where apps fall short — areas where Kifted can stand out>

## Recommendations for Kifted
<Specific, actionable suggestions based on the research>
```

## Research Scope Guidelines

- **DO** scrape public marketing pages, feature descriptions, help articles, and blog posts
- **DO** note App Store ratings and common user complaints (from review summaries on marketing pages)
- **DO** compare pricing tiers and which features are gated
- **DO NOT** attempt to log into any app or access authenticated content
- **DO NOT** scrape user-generated content, forums, or private data
- **DO NOT** download or cache copyrighted images — describe them instead
- **Keep it focused**: Research 3-5 most relevant apps per topic, not all 10

## Output

- Research summary saved to `.claude/fitness-research/<topic-slug>.md`
- Print a brief summary to the user with key findings and recommendations
- Reference the saved file for full details
