# KSITM Careers

Institutional public website foundation for **Katsina State Institute of Technology and Management**.

## Current scope

Phase 0 investigation and Phase 1 public website only. Authentication, student dashboards, databases, CMS editing and career-development tools are **not implemented**. `/login` and `/register` are explicit opening-soon entry pages. They do not collect credentials or simulate successful authentication. Public service pages explain planned tools and offer the confirmed contact email.

No new Neon project or branch was created. The existing configured `ksitmcareers` database was used only for the requested account provisioning; broader Phase 2 schema work remains outside this change.

The current authentication implementation has three requested Neon test accounts: `student1@ksitmcareers.org.ng` routes to `/dashboard`, `careerofficer1@ksitmcareers.org.ng` routes to `/staff`, and `superadmin@ksitmcareers.org.ng` routes to `/admin`. They use the requested development password `12345678`, stored only as a scrypt hash. The provisioning command is `npm run db:seed:requested-accounts`; set `SEED_PASSWORD` before using it outside local development.

## Run locally

Use Node.js 22 or later (verified on 24.11.0) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js. For production-mode verification:

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

The test runner starts its own production server on port 3100. It uses a fresh headless Chrome session; install Google Chrome locally. For CI without Chrome, install Playwright's Chrome channel with `npx playwright install chrome`, or adapt the configured channel to an installed browser. Browser tests require the existing Cloudinary assets to be reachable. Screenshot artifacts are written to `artifacts/`; test reports to `playwright-report/` and `test-results/`. These are ignored by Git.

`npm run format` formats maintained source; `npm run format:check` checks it.

## Architecture

- `src/app/`: App Router pages, metadata, shared layout and error/loading/not-found states.
- `src/components/layout/`: branded header, mobile navigation and footer.
- `src/components/public/`: focused landing-page sections and public entry pages.
- `src/components/ui/`: shared image handling, inline SVG icons and section headings.
- `src/features/public-content/`: typed reference content, services and publication-ready empty collections.
- `src/config/`: institutional configuration and allowlisted Cloudinary image delivery.
- `tests/`: browser interactions, accessibility, responsive widths, image failure and visual review.
- `docs/`: content provenance and phase handover.

Server Components are the default. Client Components are limited to mobile navigation, image events, hero controls, gallery interactions and biography expansion. The homepage composes section components rather than embedding reference HTML.

Public content is centrally maintained reference data for Phase 1. It is **not yet a CMS**. In Phase 6, published database records should populate the existing content types; ordinary content changes will then no longer need deployments. Do not treat the current static provider as that completed requirement.

## Configuration and assets

Phase 1 needs **no environment variables or secrets**; `.env.example` is intentionally empty. Add variable names only as later phases actually require them. Never commit environment values. Official branding, email, address and origin are in `src/config/site.ts`.

The original Cloudinary URLs remain in the content source. The Next.js custom loader requests resized, automatically formatted variants from that same Cloudinary account. It rejects other origins. Images have explicit layout space, responsive sizes, lazy loading, loading text and failure fallbacks. The first hero image is preloaded. Next.js self-hosts the reference Google fonts after downloading them at build time; initial builds require Google Fonts access.

Hero motion has a pause control and respects reduced-motion preferences. Gallery dialogs use native browser modal/inert/focus behaviour and Escape handling. Navigation, gallery and biography controls remain keyboard-accessible. No social-media URLs, testimonials, partner lists or statistics have been invented.

## Deployment boundary

This foundation uses standard Next.js build/start scripts compatible with Vercel, but no deployment or production configuration has been performed. The full platform is not production-ready until the later approved phases are implemented and reviewed. Use client-owned Vercel, Neon, repository, domain and media accounts for handover.

## Dependency review

Runtime dependencies are Next.js, React and React DOM. Tailwind/PostCSS, TypeScript/types and ESLint provide the requested tooling. Playwright and axe are development-only browser/accessibility verification tools; Prettier formats source consistently.

At the initial dependency review, `npm audit --omit=dev` reported zero vulnerabilities. The full audit reported five high-severity entries in the ESLint development chain, all stemming from `braces` <=3.0.3 (GHSA-vfj7-8cjw-p6xm). The registry offered no patched `braces` release; npm's automatic proposal downgraded Next's ESLint configuration to 14.x. That incompatible downgrade was not applied. ESLint 9 is retained because Next's installed React lint plugin does not declare ESLint 10 support. Recheck this development tooling before later production hardening; do not use `npm audit fix --force` without reviewing its effects.
