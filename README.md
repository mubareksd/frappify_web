# Frappify Web

The public-facing Next.js website for Frappify — handles marketing pages, unauthenticated routes, and the entry point for users before they sign in to the [app](../app/README.md).

## Requirements

- Node.js 20+
- pnpm
- A running instance of the [Frappify API](../api/README.md)

## Setup

### 1. Navigate to the web directory

```bash
cd web
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `web/` directory:

```env
# Internal URL used server-side to reach the Frappify API
API_URL=http://localhost:5000

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://frappify.localhost

# Public URLs (exposed to the browser)
NEXT_PUBLIC_APP_NAME=Frappify
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://frappify.localhost

# Used server-side for internal redirects
PUBLIC_APP_URL=http://frappify.localhost
```

### 4. Run the development server

```bash
pnpm dev
```

The site will be available at `http://frappify.localhost` (via [portless](https://github.com/nicholasgasior/portless)). If you are not using portless, run `next dev` directly and access it at `http://localhost:3000`.

## Building for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
app/
├── (auth)/           # Sign-in and sign-up routes
├── (protected)/      # Protected routes (post-login redirects)
├── (public)/         # Marketing and public pages
└── api/              # Next.js API routes (auth)
components/
├── dashboard/        # Dashboard-related components
├── layout/           # Shell, navigation, theme provider
└── ui/               # Shared UI primitives
hooks/                # React hooks (mobile detection)
lib/
├── auth-options.ts   # NextAuth configuration and credential provider
├── env.ts            # Type-safe environment variable validation
└── session.ts        # Session utilities
```
