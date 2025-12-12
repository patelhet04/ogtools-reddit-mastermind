# Reddit Mastermind 🎯

An intelligent content calendar automation tool for Reddit marketing campaigns. Generate natural-looking posts and coordinated comments across multiple personas to drive engagement and inbound leads.

## The Problem

Creating authentic Reddit engagement is time-consuming:
- Manually planning posts across multiple subreddits
- Coordinating multiple accounts to comment naturally
- Ensuring conversations don't look manufactured
- Maintaining consistent posting schedules

## The Solution

A 6-phase algorithm that generates a complete weekly content calendar:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Topic Generation                                  │
│  └─ LLM generates relevant topics based on company info     │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Subreddit Matching                                │
│  └─ LLM matches topics to best-fit subreddits               │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: Persona Orchestration                             │
│  └─ Assigns posters & commenters per thread                 │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: Scheduling                                        │
│  └─ Deterministic RNG schedules posts across the week       │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: Content Generation                                │
│  └─ LLM writes posts & comments in persona voice            │
├─────────────────────────────────────────────────────────────┤
│  Phase 6: Quality Validation                                │
│  └─ Checks for edge cases & scores authenticity             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

- **Real-time Progress Tracking** - SSE-powered live updates during generation
- **Quality Scoring** - Each calendar gets a 1-10 authenticity score
- **Edge Case Detection**:
  - Overposting in same subreddit
  - Topic overlap between posts
  - Awkward back-and-forth conversations
  - Suspiciously fast comment timing
- **Week Navigation** - Browse calendars week by week
- **Thread Context View** - See full conversation threads
- **Approve/Regenerate Workflow** - Control what goes live

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Database**: Supabase (PostgreSQL)
- **LLM**: OpenAI API (gpt-4o-mini)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Server Components + Client Hooks

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/patelhet04/ogtools-reddit-mastermind.git
cd ogtools-reddit-mastermind
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `lib/supabase-server.ts` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts`, `lib/supabase-server.ts` | Supabase anonymous key |
| `OPENAI_API_KEY` | `lib/openai.ts` | OpenAI API authentication |

### 3. Database Setup

Run the SQL in `lib/data.sql` in your Supabase SQL editor.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Create a Company** - Add company info, target subreddits, and ChatGPT queries
2. **Add Personas** - Create 2+ Reddit accounts (posters & commenters)
3. **Generate Calendar** - Watch real-time progress as the algorithm runs
4. **Review & Approve** - Check quality scores, view thread context, approve or regenerate
5. **Generate Next Week** - Continue building out future weeks

## Algorithm Deep Dive

### Deterministic Scheduling

Uses Mulberry32 PRNG seeded with `company_id + week_start` for reproducible schedules:
- Same inputs → same time slots
- Spreads posts across weekdays
- Avoids clustering

### Quality Checks

```typescript
// Comment timing (must be 15+ min after post)
checkCommentTiming(threads)

// Topic similarity (Jaccard coefficient < 0.5)
detectTopicOverlap(threads)

// Conversation patterns (no ping-pong, no self-replies)
detectAwkwardBackAndForth(threads)
```

### Risk Assessment

- **Low**: Natural timing, diverse topics, varied personas
- **Medium**: Minor overlaps or timing concerns
- **High**: Multiple red flags detected

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── calendars/        # Calendar pages
│   ├── companies/        # Company management
│   └── generate/         # Generation flow
├── components/
│   ├── calendar/         # Calendar UI components
│   ├── generate/         # Generation progress UI
│   └── ui/               # shadcn components
└── lib/
    ├── algorithm/        # Core generation logic
    │   ├── topics.ts     # Phase 1
    │   ├── matching.ts   # Phase 2
    │   ├── personas.ts   # Phase 3
    │   ├── scheduling.ts # Phase 4
    │   ├── content.ts    # Phase 5
    │   └── quality.ts    # Phase 6
    └── openai.ts         # LLM client
```

## Screenshots

| Dashboard | Calendar View | Generation Progress |
|-----------|---------------|---------------------|
| Company list, recent calendars, stats | Weekly grid with posts & comments | Real-time SSE progress tracking |

---

Built for the OG Tools Reddit Mastermind challenge 🚀
