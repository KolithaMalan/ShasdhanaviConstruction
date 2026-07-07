# Sahasdhanavi Construction Security System — Phase 1

Enterprise security management platform for the Sahasdhanavi power plant
construction site.

## Phase 1 Scope
- Public welcome page with login
- NextAuth v5 credentials authentication (7 roles)
- Role-based dashboard shell (sidebar + topbar)
- MongoDB user model + seed script
- Dark / light theme, glassmorphic UI, Framer Motion

## Stack
Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · MongoDB / Mongoose ·
NextAuth v5 · Framer Motion · Sonner · next-themes

## Quick start
```bash
npm install
cp .env.example .env.local
# fill in MONGODB_URI + secrets + seed passwords
npm run seed
npm run dev
```

Open http://localhost:3000

## Default users

| Role               | Email                              |
| ------------------ | ---------------------------------- |
| Super Admin        | SuperadminSahas@gmail.com          |
| Admin / HSEQ       | NuwanRasika@gmail.com              |
| Medical Officer    | Mahawatha@gmail.com                |
| HSEQ Officer       | Dinesh@gmail.com                   |
| Security Officer   | securityGateOfficer@gmail.com      |
| Internal Security  | LakInternal@gmail.com              |
