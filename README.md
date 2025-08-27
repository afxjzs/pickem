# Pick'em - NFL Fantasy Picks App

A Next.js-based fantasy sports application for making weekly NFL picks with confidence points and competing for prizes.

## Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Weekly Picks**: Make picks on NFL games with confidence point assignments
- **Live Scoring**: Real-time scoring and leaderboards
- **Payment Integration**: Stripe-powered entry fees and payouts
- **Admin Dashboard**: User management and payout approval
- **Responsive Design**: Mobile-first UI with Tailwind CSS v4

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API Routes + Supabase (Auth + Postgres)
- **Payments**: Stripe Checkout + Webhooks
- **Testing**: Jest + React Testing Library (unit), Supertest (API), Playwright (e2e)
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account and project
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pickem-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Edit .env.local with your actual values
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── picks/             # Picks management
│   └── standings/         # Leaderboards
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client/server
│   ├── data-providers/    # External data integrations
│   └── validations/       # Zod schemas
└── components/            # Reusable UI components

db/
└── migrations/            # Database migrations

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                  # End-to-end tests
```

## Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Deployment

The app is configured for deployment on Vercel with automatic CI/CD via GitHub Actions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
