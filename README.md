# ApplyPilot AI

ApplyPilot AI is an AI job research and LaTeX resume tailoring assistant. It helps a signed-in user research public job information, analyze fit, tailor editable LaTeX resume blocks, compile a PDF, and optionally generate a cover letter.

It is not an auto-apply bot. It does not log in to LinkedIn, Handshake, or any job platform, and it does not submit applications.

## Features

- Google login with Auth.js / NextAuth.
- Postgres persistence through Prisma.
- Per-user Gemini API key storage encrypted with AES-256-GCM.
- Server-side Gemini calls only; stored keys are never returned to the browser.
- Resume upload by pasted LaTeX.
- Marker-based resume tailoring that only changes approved editable blocks.
- Job creation from pasted job description, public job link, or role query.
- Job analysis, company notes, match score, missing skills, and resume strategy.
- Structured resume change summaries.
- Local `latexmk` PDF compilation in deployment, with optional Docker fallback in development.
- One-page PDF check with one automatic marker-only shortening attempt.
- Optional cover letter generation.

## Architecture

- `src/app`: App Router pages and API routes.
- `src/components`: Client forms and workflow controls.
- `src/lib/auth.ts`: NextAuth options and protected session helpers.
- `src/lib/crypto.ts`: AES-256-GCM encryption helpers.
- `src/lib/gemini.ts`: Gemini analysis, tailoring, shortening, and cover letter service.
- `src/lib/resume-markers.ts`: Marker extraction, marker-only patching, and template preservation validation.
- `src/lib/latex.ts`: LaTeX compiler wrapper for local `latexmk` or Docker.
- `prisma/schema.prisma`: Auth.js models plus app data models.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/applypilot?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ENCRYPTION_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
LATEX_COMPILER="local"
```

Generate secrets:

```bash
openssl rand -base64 32 # NEXTAUTH_SECRET
openssl rand -base64 32 # ENCRYPTION_KEY
```

`ENCRYPTION_KEY` must be 32 bytes encoded as base64, or 64 hex characters. Do not commit `.env`.

`GEMINI_MODEL` is optional. The default is `gemini-2.5-flash`, which Google lists as a stable Gemini API model with `generateContent` support. If your API key has access to a different model, set it here and restart the dev server.

## Google OAuth Setup

1. Create a Google Cloud OAuth client.
2. Add this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

3. Put the client id and secret into `.env`.

## Gemini API Key Behavior

Each user saves their own Gemini API key on the Settings page. The app encrypts the key before storing it and only displays a masked value such as `AIza************abcd`. AI calls decrypt the key server-side for the current request. The full key is never sent back to the frontend and should never be logged.

## Running Locally

Install dependencies:

```bash
npm install
```

Create the database schema and Prisma client:

```bash
npm run db:init
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## LaTeX Compile Requirements

For deployed containers, `LATEX_COMPILER=local` uses the `latexmk` installed in the image.

For local development you can either install TeX Live/latexmk locally or use Docker:

```bash
docker run --rm -v <tempDir>:/work -w /work texlive/texlive latexmk -pdf -interaction=nonstopmode -halt-on-error resume.tex
```

The first `texlive/texlive` pull is large. Set `LATEX_COMPILER=docker` to force Docker, `LATEX_COMPILER=local` to force local `latexmk`, or leave it as `auto`.

## Docker Compose

A simple `docker-compose.yml` is included for local development. Running directly with `npm run dev` is simpler for most local usage.

```bash
docker compose up
```

## Resume Markers

Only content inside approved markers can be changed:

```latex
% === SUMMARY_START ===
...
% === SUMMARY_END ===

% === PROJECT_FIXROUTE_START ===
...
% === PROJECT_FIXROUTE_END ===
```

The app validates that document class, packages, margins, fonts, custom commands, spacing, education, dates, links, and section order stay outside Gemini edits.

## Security Notes

- All protected pages require login.
- API routes check authentication and per-user ownership.
- Gemini API keys are encrypted with AES-256-GCM.
- Stored keys are not returned to the frontend.
- The app only fetches public URLs and never authenticates to job platforms.
- Resume tailoring prompts explicitly prohibit invented experience.

## Limitations

- Public job pages that block automated access may need pasted job descriptions.
- PDF compilation requires either local `latexmk` or Docker.
- Generated PDFs are stored on the app filesystem. On free hosts, files may disappear after redeploys or restarts, so download PDFs after compiling.
- Gemini quality depends on the user’s key, model availability, and the factual completeness of the resume and job text.

## Free Deployment: Koyeb + Neon

The recommended free deployment path is Koyeb Free Instance for the Dockerized app and Neon Free Postgres for persistent data.

1. Create a Neon Postgres database and copy the connection string.
2. In Koyeb, create a Web Service from this GitHub repo and choose Dockerfile deployment.
3. Add environment variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/applypilot?sslmode=require"
NEXTAUTH_URL="https://your-koyeb-app.koyeb.app"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ENCRYPTION_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
LATEX_COMPILER="local"
```

4. In Google Cloud OAuth, add:

```text
https://your-koyeb-app.koyeb.app
https://your-koyeb-app.koyeb.app/api/auth/callback/google
```

5. Deploy. The container installs TeX packages, runs `prisma db push`, starts Next.js, and compiles PDFs with local `latexmk`.

## Roadmap

- Richer resume version comparison.
- Safer PDF page counting with `pdfinfo` when available.
- Optional separate LaTeX compiler service.
- Export job analysis and change summaries.
- More resume marker templates.
