# Car Chaos – VIT on Wheels
### *Privacy-First Student Carpooling & Ride Sharing Platform*

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20Realtime-3ECF8E?logo=supabase)](https://supabase.com/)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%26%20Start-FF4154)](https://tanstack.com/)

A modern, full-stack carpooling web application built specifically for college students. Students can share rides, split travel expenses, reduce traffic congestion, and travel safely together.

---

## Key Features

- **Privacy-Preserving Authentication**: Zero email collection. Users register and log in strictly using a unique Username, Password, and Confirmation, eliminating personal data breach vectors.
- **Post Rides**: Drivers can post trips with origin, destination, date, departure time, available seats, gender preferences, and special notes.
- **Search & Discover**: Students can filter and search available rides matching their schedule and route.
- **Realtime Ride Coordination**: Live booking requests with instant accept/decline statuses powered by Supabase Realtime WebSocket listeners.
- **Secure Persistent Chat**: Drivers and accepted passengers coordinate trip details with message persistence and strict multi-tenant isolation.
- **Modern Responsive UI**: Built with Tailwind CSS v4, smooth glassmorphism, responsive mobile-friendly layouts, and accessible UI controls.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, TanStack Router, TanStack Start |
| **Styling & UI** | Tailwind CSS v4, Radix UI primitives, Lucide Icons, Sonner |
| **Backend & DB** | Supabase (Managed PostgreSQL, Row-Level Security, Realtime WebSockets) |
| **Tooling & Runtime** | Bun, Vite 8, Rolldown / Nitro SSR engine |

---

## Project Structure

```text
car-chaos/
├── public/                 # Static assets, favicon, robots.txt
├── src/
│   ├── assets/             # Images, car illustrations, backgrounds
│   ├── components/         # Reusable UI components (SiteHeader, ChatPanel, etc.)
│   │   └── ui/             # Radix-based UI components (buttons, dialogs, inputs)
│   ├── hooks/              # Custom hooks (useAuth, useMobile)
│   ├── integrations/       # Supabase client and auth handlers
│   ├── routes/             # TanStack file-based routes
│   │   ├── index.tsx       # Landing page & intro animation
│   │   ├── auth.tsx        # Username/password sign in & registration
│   │   ├── _authenticated/ # Protected routes (post, search, rides)
│   └── styles.css          # Tailwind CSS styles and glassmorphism themes
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema & RLS security rules
├── .env.example            # Template for environment configuration
└── package.json            # Dependencies and build scripts
```

---

## Quickstart Guide

### 1. Prerequisites
- Bun (v1.2+) or Node.js (v20+)
- A Supabase account

### 2. Clone the Repository
```bash
git clone https://github.com/vidhiverma1091-cloud/Car-Chaos-Carpooling.git
cd Car-Chaos-Carpooling
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Database Setup (Supabase)
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the entire script from `supabase/schema.sql` and click **Run**.
3. All tables, security policies, and automatic confirmation triggers are created.

---

## Security & Privacy Architecture

- **Row-Level Security (RLS)**: Enforced directly at the PostgreSQL layer. Users can only update their own ride posts and view authorized requests.
- **Data Minimization**: Zero collection of personal emails, phone numbers, or trackable identifiers.
- **Encrypted Credentials**: Passwords are securely hashed with industry-standard bcrypt via Supabase Auth.

---

## License
This project is open-source and available under the [MIT License](LICENSE).
