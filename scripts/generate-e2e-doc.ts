/**
 * Generates SimLight 2.0 End-to-End Technical & Product Documentation (DOCX)
 * Run: npx tsx scripts/generate-e2e-doc.ts
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx'
import { writeFileSync } from 'fs'
import { join } from 'path'

const DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function h1(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
}

function h2(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } })
}

function h3(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } })
}

function p(text: string, opts?: { bold?: boolean; italic?: boolean }) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: opts?.bold, italics: opts?.italic })],
  })
}

function bullet(text: string) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  })
}

function table(headers: string[], rows: string[][]) {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          shading: { fill: 'E8EAF6' },
        })
    ),
  })
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell) => new TableCell({ children: [new Paragraph(cell)] })),
      })
  )
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {},
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'SimLight 2.0 — E2E Documentation', size: 18, color: '666666' }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Confidential — Internal Use | Page ', size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
              ],
            }),
          ],
        }),
      },
      children: [
        // COVER
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SimLight 2.0', bold: true, size: 72, color: '4F46E5' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'End-to-End Technical & Product Documentation',
              bold: true,
              size: 36,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Prototype Platform — Current State', size: 28, color: '444444' })],
        }),
        new Paragraph({ spacing: { before: 800 } }),
        table(
          ['Field', 'Value'],
          [
            ['Document Version', '1.0'],
            ['Date', DATE],
            ['Status', 'Prototype / Pre-Production'],
            ['Audience', 'Senior Engineering, Product Management, Architecture Review'],
            ['Repository', 'Simlight_prototype'],
            ['API Version', '5.0'],
          ]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // EXECUTIVE SUMMARY
        h1('1. Executive Summary'),
        p(
          'SimLight 2.0 is a full-stack web platform that enables faculty and content creators to design, publish, and assign interactive business simulations, while learners discover and play them through a public portal inspired by game discovery platforms such as Cool Math Games.'
        ),
        p(
          'The prototype delivers an end-to-end workflow: a seven-step creation wizard with AI-assisted content generation, media-rich learner playback with scoring and feedback, organization-scoped tenancy, assignment management, analytics, and a public marketplace for published simulations.'
        ),
        p('Key outcomes delivered in the current build:', { bold: true }),
        bullet('Public discovery portal (home, browse, search, simulation detail pages)'),
        bullet('Faculty studio with JWT auth, org tenancy, and protected creator routes'),
        bullet('Real LLM integration (OpenAI, Anthropic, NVIDIA NIM) with mock fallback'),
        bullet('SQLite default persistence with optional PostgreSQL and Docker deployment'),
        bullet('Metric-based scoring, AI coach feedback, visibility controls, and email notifications'),

        h1('2. Introduction & Product Vision'),
        h2('2.1 Problem Statement'),
        p(
          'Traditional business simulations are expensive to build, difficult to distribute, and often locked inside learning management systems. Faculty lack tools to rapidly author scenario-based content; learners lack engaging, low-friction access to practice decision-making.'
        ),
        h2('2.2 Solution'),
        p(
          'SimLight combines a no-code simulation studio for educators with a consumer-grade browse-and-play experience for learners. Simulations are structured as phased events with branching decisions, weighted metrics, budget/risk dynamics, and optional video scene backgrounds.'
        ),
        h2('2.3 Strategic Positioning'),
        p(
          'Position SimLight as the "Cool Math Games for business simulations" — curated, searchable, instantly playable content — with an enterprise-grade faculty layer underneath for assignments, analytics, and institutional control.'
        ),
        h2('2.4 Target Users'),
        table(
          ['Persona', 'Goals', 'Primary Routes'],
          [
            ['Faculty / Content Creator', 'Create, publish, assign, analyze', '/teach, /creator/:id, /assign, /analytics'],
            ['Learner', 'Play assigned or public simulations', '/, /browse, /play/:id, /learn'],
            ['Org Admin', 'Invite team, manage org', '/team, /register'],
            ['Public Visitor', 'Discover and try simulations', '/', '/browse, /sim/:id'],
          ]
        ),

        h1('3. Product Features — Current State'),
        h2('3.1 Seven-Step Creator Wizard'),
        table(
          ['Step', 'Name', 'Capabilities'],
          [
            ['1', 'Define', 'Title, domain, industry, difficulty, duration, learning objectives'],
            ['2', 'AI Generate', 'LLM content generation with source tracking (OpenAI/Anthropic/NVIDIA/mock)'],
            ['3', 'Review & Customize', 'Edit events/decisions, drag-and-drop reorder, auto-save'],
            ['4', 'Media', 'Upload images, videos, documents; scene preview'],
            ['5', 'Scoring', 'Manual or AI-assisted scoring; configure weighted metrics'],
            ['6', 'Preview', 'Faculty playtest with media in scene'],
            ['7', 'Publish', 'Visibility: private / organization / public marketplace'],
          ]
        ),
        h2('3.2 Public Discovery Portal (CMG-Style)'),
        bullet('Home page with curated rails: Featured, New, Top Played, category collections'),
        bullet('Browse with search, category filters, difficulty, industry, and sort options'),
        bullet('Simulation detail page with scenario, objectives, media preview, play CTA'),
        bullet('Simulation cards with thumbnails, play counts, and average scores'),
        h2('3.3 Learner Player'),
        bullet('Session-based play with timer and resume support'),
        bullet('Video/image scene backgrounds during events'),
        bullet('AI coach feedback after each decision (when AI-assisted scoring enabled)'),
        bullet('Weighted metric scoring and completion summary'),
        h2('3.4 Faculty & Operations'),
        bullet('JWT authentication with organization registration and login'),
        bullet('Assignment creation with optional email invites (SMTP or DB log)'),
        bullet('Analytics dashboard with CSV export'),
        bullet('Simulation duplicate, team invites, password reset flow'),
        bullet('Learner portal for assignment list'),

        h1('4. System Architecture'),
        h2('4.1 High-Level Architecture'),
        p('The platform follows a classic SPA + REST API architecture with a pluggable data store layer.'),
        p('Components:', { bold: true }),
        bullet('Client: React 19 SPA (Vite, TypeScript, Tailwind CSS v4, React Router v7)'),
        bullet('API Server: Express 5 (TypeScript, tsx runtime)'),
        bullet('Persistence: SQLite (default) via better-sqlite3; PostgreSQL via pg (optional)'),
        bullet('AI Layer: Provider abstraction (OpenAI, Anthropic, NVIDIA NIM, mock fallback)'),
        bullet('File Storage: Local filesystem (multer) under server/data/uploads/'),
        bullet('Email: Nodemailer with SMTP or database audit log fallback'),
        h2('4.2 Architecture Diagram (Logical)'),
        p(
          '[Browser] → Vite Dev Proxy (/api, /uploads) → [Express API v5] → [Store Facade] → [SQLite | PostgreSQL]',
          { italic: true }
        ),
        p(
          '                              ↓',
          { italic: true }
        ),
        p(
          '                    [LLM Providers] [Email Service] [Static Uploads]',
          { italic: true }
        ),
        h2('4.3 Backend Module Structure'),
        table(
          ['Module', 'Path', 'Responsibility'],
          [
            ['Entry', 'server/index.ts', 'HTTP server, middleware, route mounting'],
            ['Routes', 'server/routes.ts', 'Simulations, sessions, marketplace, AI status'],
            ['Auth', 'server/auth/', 'JWT, bcrypt, register/login, invites, password reset'],
            ['Store', 'server/store/index.ts', 'Database abstraction (SQLite vs Postgres)'],
            ['DB Layer', 'server/db.ts, server/users.ts', 'SQLite CRUD, migrations'],
            ['PG Layer', 'server/pg/', 'PostgreSQL schema and store'],
            ['LLM', 'server/llm/', 'Prompt, parse, generate, providers'],
            ['Services', 'server/services/', 'Scoring, visibility, email, catalog'],
            ['Upload', 'server/upload.ts', 'Multer config, public URL helpers'],
          ]
        ),
        h2('4.4 Frontend Module Structure'),
        table(
          ['Area', 'Path', 'Responsibility'],
          [
            ['Pages', 'src/pages/', 'Home, Browse, Sim Detail, Teach, Creator, Player, etc.'],
            ['Wizard Steps', 'src/components/steps/', 'DefineSimulationStep through PublishSimulationStep'],
            ['Catalog UI', 'src/components/catalog/', 'Cards, rails, search'],
            ['Layout', 'src/components/layout/', 'PublicLayout, Header, CreatorWizardProgress'],
            ['State', 'src/context/', 'AuthContext, SimulationContext (auto-save)'],
            ['API Client', 'src/api/client.ts', 'Typed REST client with Bearer token'],
          ]
        ),

        h1('5. Data Architecture'),
        h2('5.1 Core Entities'),
        table(
          ['Entity', 'Description'],
          [
            ['organizations', 'Multi-tenant root; slug, name'],
            ['users', 'Faculty, learner, admin roles; org-scoped'],
            ['simulations', 'Meta, generated JSON, scoring, visibility, publish state'],
            ['assets', 'Uploaded media linked to simulations'],
            ['assignments', 'Learner assignments with due dates, invite tokens'],
            ['sessions', 'Play sessions with scores, metrics, decisions, timer'],
            ['org_invites', 'Team invitation tokens'],
            ['password_resets', 'Password reset tokens with expiry'],
            ['email_log', 'Audit trail when SMTP not configured'],
          ]
        ),
        h2('5.2 Visibility Model'),
        table(
          ['Visibility', 'Who Can Play', 'Listed in Marketplace'],
          [
            ['private', 'Faculty, assignment link, play token', 'No'],
            ['organization', 'Org members, assignment links', 'No'],
            ['public', 'Anyone', 'Yes'],
          ]
        ),

        h1('6. API Reference Summary'),
        h2('6.1 Authentication'),
        table(
          ['Method', 'Endpoint', 'Description'],
          [
            ['POST', '/api/auth/register', 'Create org + faculty user'],
            ['POST', '/api/auth/login', 'JWT login'],
            ['GET', '/api/auth/me', 'Current user (auth required)'],
            ['POST', '/api/auth/invite', 'Invite team member (faculty)'],
            ['POST', '/api/auth/forgot-password', 'Request password reset'],
            ['POST', '/api/auth/reset-password', 'Consume reset token'],
            ['GET', '/api/auth/assignments', 'Learner assignment list'],
          ]
        ),
        h2('6.2 Public Catalog'),
        table(
          ['Method', 'Endpoint', 'Description'],
          [
            ['GET', '/api/marketplace/home', 'Curated home feed'],
            ['GET', '/api/marketplace', 'Search/filter public simulations'],
            ['GET', '/api/marketplace/categories', 'Category taxonomy'],
            ['GET', '/api/marketplace/:id', 'Public simulation detail'],
          ]
        ),
        h2('6.3 Simulations (Faculty — Auth Required)'),
        table(
          ['Method', 'Endpoint', 'Description'],
          [
            ['GET/POST', '/api/simulations', 'List / create'],
            ['GET/PATCH/DELETE', '/api/simulations/:id', 'CRUD'],
            ['POST', '/api/simulations/:id/generate', 'AI content generation'],
            ['POST', '/api/simulations/:id/publish', 'Publish with visibility'],
            ['POST', '/api/simulations/:id/duplicate', 'Clone simulation'],
            ['POST', '/api/simulations/:id/upload', 'Media upload'],
            ['GET', '/api/simulations/:id/analytics', 'Faculty analytics'],
            ['GET', '/api/simulations/:id/analytics/export', 'CSV export'],
            ['POST', '/api/simulations/:id/assignments', 'Assign learner'],
          ]
        ),
        h2('6.4 Play Sessions (Public)'),
        table(
          ['Method', 'Endpoint', 'Description'],
          [
            ['POST', '/api/simulations/:id/sessions', 'Start or resume session'],
            ['GET', '/api/sessions/:sessionId', 'Get session + simulation'],
            ['POST', '/api/sessions/:sessionId/decide', 'Submit decision; scoring + AI feedback'],
          ]
        ),
        h2('6.5 System'),
        table(
          ['Method', 'Endpoint', 'Description'],
          [
            ['GET', '/api/health', 'Health, DB kind, AI status'],
            ['GET', '/api/ai/status', 'LLM provider configuration'],
          ]
        ),

        h1('7. Frontend Routes'),
        table(
          ['Route', 'Access', 'Purpose'],
          [
            ['/', 'Public', 'Home — discovery portal'],
            ['/browse', '/browse/:category', 'Public', 'Search and filter catalog'],
            ['/sim/:id', 'Public', 'Simulation detail page'],
            ['/play/:id', 'Public', 'Start play session'],
            ['/session/:sessionId', 'Public', 'Learner player'],
            ['/login, /register', 'Public', 'Authentication'],
            ['/teach', 'Faculty', 'Dashboard — manage simulations'],
            ['/creator/:id', 'Faculty', '7-step wizard'],
            ['/assign/:id', 'Faculty', 'Learner assignments'],
            ['/analytics/:id', 'Faculty', 'Reports and CSV export'],
            ['/team', 'Faculty', 'Invite colleagues'],
            ['/learn', 'Auth', 'Learner assignment portal'],
          ]
        ),

        h1('8. AI / LLM Integration'),
        p('SimLight supports multiple LLM providers through a unified generation pipeline with automatic fallback.'),
        table(
          ['Provider', 'Env Variables', 'Use Case'],
          [
            ['NVIDIA NIM', 'NVIDIA_API_KEY, NVIDIA_MODEL', 'OpenAI-compatible integrate API'],
            ['OpenAI', 'OPENAI_API_KEY, OPENAI_MODEL', 'Primary generation (gpt-4o-mini default)'],
            ['Anthropic', 'ANTHROPIC_API_KEY, ANTHROPIC_MODEL', 'Claude-based generation'],
            ['Mock', 'No keys', 'Demo content when no provider configured'],
          ]
        ),
        p('LLM_PROVIDER env: auto | openai | anthropic | nvidia | mock'),
        p('AI is used for: (1) full simulation content generation in Step 2, (2) per-decision coach feedback when scoring type is AI-assisted.'),

        h1('9. Security & Multi-Tenancy'),
        bullet('JWT Bearer tokens for authenticated API requests'),
        bullet('bcrypt password hashing'),
        bullet('Organization-scoped simulation CRUD — faculty cannot access other orgs\' data'),
        bullet('Visibility enforcement on play routes (private token, org, public)'),
        bullet('Faculty-only routes protected by requireAuth + requireFaculty middleware'),
        bullet('Play routes remain public for learner access without accounts'),
        p('Production recommendations: rotate JWT_SECRET, enforce HTTPS, rate-limit auth endpoints, secrets via vault, never commit .env.'),

        h1('10. CI/CD Pipeline'),
        h2('10.1 Current State'),
        p(
          'The repository includes npm scripts for build/lint and a GitHub Actions workflow at .github/workflows/ci.yml that runs lint and build on push/PR to main.'
        ),
        table(
          ['Script', 'Command', 'Purpose'],
          [
            ['dev', 'npm run dev', 'Concurrent Vite + API watch mode'],
            ['build', 'npm run build', 'tsc -b && vite build'],
            ['lint', 'npm run lint', 'oxlint static analysis'],
            ['preview', 'npm run preview', 'Preview production frontend build'],
          ]
        ),
        h2('10.2 Recommended CI Pipeline (GitHub Actions)'),
        p('Trigger: pull_request and push to main'),
        bullet('Job 1 — Install: npm ci'),
        bullet('Job 2 — Lint: npm run lint'),
        bullet('Job 3 — Build: npm run build'),
        bullet('Job 4 — Type check: tsc -b --noEmit (included in build)'),
        bullet('Job 5 — (Future) Integration tests against SQLite test DB'),
        h2('10.3 Recommended CD Pipeline'),
        bullet('Build Docker image from Dockerfile (multi-stage: build + runtime)'),
        bullet('Push to container registry (ACR, ECR, or GHCR)'),
        bullet('Deploy via docker compose or Kubernetes with env secrets'),
        bullet('Run database migrations on deploy (SQLite volume or Postgres)'),
        bullet('Health check: GET /api/health must return status ok'),
        h2('10.4 Environment Promotion'),
        table(
          ['Environment', 'Database', 'LLM', 'Notes'],
          [
            ['Local Dev', 'SQLite', 'Mock or dev API keys', 'npm run dev, port 5173 + 3001'],
            ['Staging', 'PostgreSQL', 'Staging keys', 'Docker compose, smoke tests'],
            ['Production', 'PostgreSQL HA', 'Production keys', 'Secrets manager, CDN for static assets'],
          ]
        ),

        h1('11. Deployment Architecture'),
        h2('11.1 Docker'),
        p('Dockerfile: multi-stage build — Node 22 Alpine, npm ci, vite build, tsx API runtime on port 3001.'),
        p('docker-compose.yml: postgres service + app service with persistent volumes (pgdata, simlight-data).'),
        h2('11.2 Runtime Configuration'),
        p('See .env.example for full variable list. Critical variables:'),
        bullet('JWT_SECRET — authentication signing key'),
        bullet('DATABASE_URL — optional; omit for SQLite'),
        bullet('NVIDIA_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY — LLM providers'),
        bullet('SMTP_* — email delivery for assignments and invites'),
        bullet('APP_URL — base URL for email links'),
        h2('11.3 Local Development'),
        p('npm install → cp .env.example .env → npm run dev'),
        p('Frontend: http://localhost:5173 | API: http://localhost:3001/api/health'),
        p('Vite proxies /api and /uploads to the Express server.'),

        h1('12. Enhancements Delivered (Prototype Phases)'),
        table(
          ['Phase', 'Deliverables'],
          [
            ['Phase 1', '7-step UI wizard, mock AI, React context state'],
            ['Phase 2', 'Express API, simulation CRUD, learner sessions'],
            ['Phase 3', 'SQLite, file uploads, assignments, analytics'],
            ['Phase 4', 'OpenAI/Anthropic LLM integration with fallback'],
            ['Phase 5', 'JWT auth, org tenancy, optional PostgreSQL'],
            ['Phase 6', 'Metric scoring, AI feedback, visibility, email, marketplace'],
            ['Phase 7', 'CMG-style public portal: home, browse, search, sim detail'],
            ['Phase 7+', 'NVIDIA NIM provider, video scene media, auto-save, drag-drop'],
          ]
        ),

        h1('13. Roadmap & Future Enhancements'),
        h2('13.1 Near-Term (Next Sprint)'),
        bullet('GitHub Actions CI workflow (.github/workflows/ci.yml) — lint + build'),
        bullet('Per-event media binding (video per phase/event)'),
        bullet('Featured editorial admin panel'),
        bullet('Integration test suite (API + auth flows)'),
        h2('13.2 Medium-Term'),
        bullet('LMS integration (LTI 1.3 / Canvas, Moodle)'),
        bullet('SSO (SAML/OIDC) for institutions'),
        bullet('Cohort leaderboards and class codes'),
        bullet('Supervisor / program manager analytics layer'),
        bullet('PDF report export for faculty'),
        h2('13.3 Long-Term'),
        bullet('External publisher marketplace with moderation'),
        bullet('Multiplayer / team decision rooms'),
        bullet('Mobile-responsive PWA and offline resume'),
        bullet('Revenue / institutional licensing model'),

        h1('14. Known Limitations'),
        bullet('PostgreSQL path lacks full parity for invites, password reset, and catalog stats'),
        bullet('CI workflow present; CD/deploy pipeline not yet automated'),
        bullet('Single-node file storage — not suitable for horizontal scale without S3 migration'),
        bullet('No automated test coverage in repository'),
        bullet('Assign to class only works for simulations owned by faculty org'),
        bullet('API keys must not be committed; rotate if exposed in chat or logs'),

        h1('15. Appendix'),
        h2('15.1 Technology Stack'),
        table(
          ['Layer', 'Technologies'],
          [
            ['Frontend', 'React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7'],
            ['Backend', 'Express 5, TypeScript, tsx, JWT, bcryptjs, multer, nodemailer'],
            ['Database', 'better-sqlite3 (default), pg / PostgreSQL (optional)'],
            ['AI', 'OpenAI API, Anthropic API, NVIDIA NIM (OpenAI-compatible)'],
            ['Tooling', 'oxlint, concurrently, Docker, docker compose'],
          ]
        ),
        h2('15.2 Document Approval'),
        table(
          ['Role', 'Name', 'Signature', 'Date'],
          [
            ['Product Manager', '', '', ''],
            ['Senior Developer / Tech Lead', '', '', ''],
            ['Engineering Manager', '', '', ''],
          ]
        ),
        p(`Document generated: ${DATE}`, { italic: true }),
      ],
    },
  ],
})

const outPath = join(process.cwd(), 'docs', 'SimLight_2.0_E2E_Documentation.docx')
const buffer = await Packer.toBuffer(doc)
writeFileSync(outPath, buffer)
console.log(`Created: ${outPath}`)
