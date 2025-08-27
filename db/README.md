# Database Setup for Pick'em App

This directory contains the database schema, migrations, and seed data for the Pick'em MVP application.

## Structure

- `migrations/` - Database schema changes
- `seed.sql` - Sample data for testing
- `README.md` - This file

## Database Schema

The MVP uses a PostgreSQL database with the following tables:

### Core Tables
- **users** - User profiles (mirrors Supabase auth)
- **games** - NFL games with metadata (SNF/MNF flags, kickoff times, spreads)
- **picks** - User picks with confidence points (1-N)
- **scores** - Weekly and season score aggregates
- **payments** - Stripe payment tracking
- **app_config** - Application configuration (pricing, lock offsets)

### Key Features
- UUID primary keys for security
- Proper foreign key constraints
- Automatic `updated_at` timestamps
- Performance indexes on common queries
- Check constraints for data validation

## Setup Instructions

### 1. Local Development with Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### 2. Remote Supabase Project

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations to remote
supabase db push

# Reset remote database (WARNING: destroys all data)
supabase db reset
```

### 3. Manual Setup

```bash
# Connect to your PostgreSQL database
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB

# Run the migration
\i db/migrations/0001_init.sql

# Optionally seed with sample data
\i db/seed.sql
```

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Testing the Database

After setup, you can verify the database is working:

```bash
# Check if tables exist
supabase db diff

# View sample data
supabase db reset  # This will apply migrations and seed data
```

## Schema Changes

When making schema changes:

1. Create a new migration file: `db/migrations/0002_add_new_feature.sql`
2. Update the TypeScript types in `src/lib/types/database.ts`
3. Test locally with `supabase db reset`
4. Apply to production with `supabase db push`

## Sample Data

The `seed.sql` file includes:
- 3 test users (1 admin, 2 regular users)
- Week 1 NFL games with SNF/MNF flags
- Sample picks with confidence points
- Sample payments and scores

This provides a complete testing environment for development.
