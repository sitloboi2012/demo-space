# Momentus Compliance Portal

## Overview

This is a full-stack compliance review portal for Momentus Space. The application allows users to create compliance reviews, upload documents (Host PUG and Payload Spec files), and generate AI-powered compliance matrices and interface control documents (ICDs). The system uses OpenAI integration for document analysis and compliance checking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with hot module replacement
- **Fonts**: Inter (body) and Space Grotesk (headings)

The frontend follows a page-based structure with reusable components. Pages are in `client/src/pages/`, shared components in `client/src/components/`, and UI primitives in `client/src/components/ui/`.

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **AI Integration**: OpenAI API via Replit AI Integrations for compliance analysis

The server uses a storage pattern (`server/storage.ts`) that abstracts database operations, making it easy to swap implementations.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Managed via `drizzle-kit push`
- **Main Tables**:
  - `reviews`: Compliance review records
  - `documents`: Uploaded document metadata
  - `complianceItems`: AI-generated compliance matrix items
  - `conversations`/`messages`: Chat history for AI interactions

### Build & Development
- **Development**: `npm run dev` runs Vite dev server with Express backend
- **Production Build**: `npm run build` uses esbuild for server and Vite for client
- **Type Checking**: `npm run check`
- **Database Sync**: `npm run db:push`

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe SQL query builder and schema management

### AI Services
- **OpenAI API**: Used for compliance analysis, ICD generation, and negotiation summarization
- **Environment Variables**:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key for OpenAI
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: Base URL for API requests

### UI Components
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Low-level UI primitives for dialogs, dropdowns, toasts, etc.
- **Lucide React**: Icon library

### Replit Integrations
The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built utilities for:
- **Audio**: Voice recording, playback, and speech-to-text
- **Chat**: Conversation storage and streaming
- **Image**: AI image generation
- **Batch**: Rate-limited batch processing for AI operations

These are optional utilities that can be used when building AI-powered features.