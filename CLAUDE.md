# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a satellite payload compliance review application that automates the analysis of spacecraft integration requirements. The system extracts requirements from uploaded documents (Host PUG and Payload Specifications), performs AI-driven compliance analysis, and generates Interface Control Documents (ICDs).

## Development Commands

```bash
# Start development server (both client and API)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start

# Database migrations
npm run db:push
```

## Architecture

**Full-Stack TypeScript Monorepo** with three main directories:

- `client/` - React frontend (Vite + Wouter routing)
- `server/` - Express API backend
- `shared/` - Shared types, schemas, and API definitions

### Key Architectural Patterns

**Shared Schema & API Contract (`shared/`):**
- Database schema defined in `shared/schema.ts` using Drizzle ORM
- API routes typed in `shared/routes.ts` with Zod validation
- Both client and server import from `@shared/*` for type safety
- `buildUrl()` helper constructs parameterized API paths

**Request Flow:**
1. Client hooks (`client/src/hooks/use-reviews.ts`) call API using definitions from `shared/routes.ts`
2. Express routes (`server/routes.ts`) validate input with Zod schemas
3. Storage layer (`server/storage.ts`) handles database operations via Drizzle
4. OpenAI integration generates compliance items and ICD documents

**Data Model Relationships:**
- Reviews (1) → Documents (many) + Compliance Items (many)
- Review status: "Pending Analysis" → "Analysis Complete"
- Compliance status: "Compliant" | "Deviation" | "Fail"

### AI Integration

The app uses OpenAI (GPT-5.1) for two key features:

1. **Compliance Matrix Generation** (`POST /api/reviews/:reviewId/compliance/generate`):
   - Analyzes uploaded documents to extract requirements
   - Generates compliance items with categories, limits, measurements, and status
   - Updates review status to "Analysis Complete"

2. **ICD Generation** (`POST /api/reviews/:reviewId/icd/generate`):
   - Requires compliance analysis to be complete first
   - Generates markdown-formatted Interface Control Documents
   - Includes mechanical, electrical, power, and thermal interfaces

Environment variables:
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL

### Database

Uses PostgreSQL via Drizzle ORM:
- Schema defined in `shared/schema.ts`
- Connection in `server/db.ts` via `DATABASE_URL` env var
- Three tables: `reviews`, `documents`, `complianceItems`
- Relations defined using Drizzle's relational API

### Frontend Stack

- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI primitives + custom components in `client/src/components/ui/`
- **Styling**: Tailwind CSS with custom fonts (Inter, Space Grotesk)
- **Path Aliases**: `@/*` → `client/src/*`, `@shared/*` → `shared/*`, `@assets/*` → `attached_assets/*`

### Build Process

`script/build.ts` orchestrates the build:
1. Builds client with Vite → `dist/public/`
2. Bundles server with esbuild → `dist/index.cjs`
3. Allowlist specifies which dependencies to bundle (reduces cold starts)

In development, Vite dev server is integrated via `server/vite.ts`. In production, static files served from `dist/public/`.

### Environment Configuration

The app runs on a single port (default 5000, configured via `PORT` env var) and serves both API and client. In development, Vite middleware handles frontend requests; in production, static middleware serves built files.

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- `PORT` (optional, defaults to 5000)
- `NODE_ENV` (development|production)

### Code Organization

The codebase follows a feature-based structure within each layer:
- Client pages (`client/src/pages/`): Dashboard, ReviewDetail
- Client components (`client/src/components/`): CreateReviewDialog, Sidebar, StatusBadge, ui/
- Server routes (`server/routes.ts`): All API endpoints with OpenAI integration
- Storage layer (`server/storage.ts`): Database abstraction via `IStorage` interface
