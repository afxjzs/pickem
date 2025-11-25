# Vercel Deployment Guide for Pickem

This guide walks through deploying the pickem application to Vercel and configuring it to use a shared Supabase project with the `pickem` schema.

## Prerequisites

- GitHub repository with pickem code
- Vercel account (free tier is sufficient)
- Access to shared Supabase project (tzffjzocrazemvtgqavg)
- Supabase project credentials (URL and keys)

## Important Warnings

### ⚠️ CRITICAL: NEVER RUN `supabase db reset` ON THE DOUG-IS DATABASE

**THE COMMAND `supabase db reset` IS COMPLETELY FORBIDDEN AND CANNOT BE RUN AT ALL ON THE DOUG-IS DATABASE**

- **DO NOT RUN**: `supabase db reset` - This command is ABSOLUTELY FORBIDDEN
- **DO NOT RUN**: Any command that resets or drops the database
- **CANNOT BE RUN AT ALL**: The command `supabase db reset` cannot be run at all on the doug-is database under any circumstances
- **WHY**: This command would DESTROY all doug-is production data in the `public` schema
- **CONSEQUENCE**: doug-is has production data that must remain intact - running reset would cause permanent data loss
- **WHAT TO DO INSTEAD**: 
  - Run migrations manually via Supabase SQL Editor in the dashboard
  - Or use `supabase db push` to apply migrations (NOT reset)
  - Never use any reset, drop, or destructive commands
- **IF YOU SEE IT IN DOCS**: If any documentation, scripts, or guides suggest `supabase db reset`, DO NOT follow that instruction
- **EVEN FOR TESTING**: Even if troubleshooting or testing, NEVER use `supabase db reset` on this shared project
- **THIS IS NON-NEGOTIABLE**: Under no circumstances should `supabase db reset` be run on the doug-is database

## Phase 1: Supabase Schema Setup

### Step 1.1: Run Migrations in Supabase

1. Log into the Supabase dashboard: https://supabase.com/dashboard
2. Navigate to the shared project (tzffjzocrazemvtgqavg)
3. Go to **SQL Editor**
4. Run each migration in order:

#### Migration 0008: Create Pickem Schema
- Open `supabase/migrations/0008_create_pickem_schema.sql`
- Copy the entire contents
- Paste into SQL Editor
- Click **Run** or press `Cmd/Ctrl + Enter`
- Verify success message

#### Migration 0009: Create Pickem Tables
- Open `supabase/migrations/0009_create_pickem_tables.sql`
- Copy the entire contents
- Paste into SQL Editor
- Click **Run** or press `Cmd/Ctrl + Enter`
- Verify success message

#### Migration 0010: Create RLS Policies
- Open `supabase/migrations/0010_update_rls_for_pickem_schema.sql`
- Copy the entire contents
- Paste into SQL Editor
- Click **Run** or press `Cmd/Ctrl + Enter`
- Verify success message

### Step 1.2: Verify Schema Creation

1. In Supabase dashboard, go to **Table Editor**
2. You should see a schema dropdown - select `pickem`
3. Verify all tables exist:
   - `users`
   - `games`
   - `picks`
   - `scores`
   - `teams`
   - `standings`
   - `payments`
   - `app_config`

### Step 1.3: Initial Data Population

After migrations complete, populate initial data using one of these methods:

**Option 1: Run Sync Script Locally**
```bash
npm run sync:games
```

**Option 2: Let API Auto-Sync**
- The API routes will automatically sync teams and games on first request
- Simply access the app after deployment and the sync will trigger

## Phase 2: Environment Variables

### Step 2.1: Get Supabase Credentials

From the Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://tzffjzocrazemvtgqavg.supabase.co`
   - **anon/public key**: (starts with `eyJ...`)
   - **service_role key**: (starts with `eyJ...`) - **Keep this secret!**

### Step 2.2: Configure Vercel Environment Variables

1. In Vercel dashboard, go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tzffjzocrazemvtgqavg.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (your service role key) | Production, Preview, Development |

**Note**: These are the same credentials used by doug-is since both apps share the same Supabase project.

## Phase 3: Vercel Deployment

### Step 3.1: Connect Repository

1. Log into Vercel: https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository containing pickem
4. Vercel will auto-detect Next.js

### Step 3.2: Configure Build Settings

Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 3.3: Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Vercel will provide a deployment URL (e.g., `pickem.vercel.app`)

### Step 3.4: Verify Deployment

1. Visit the deployment URL
2. Check that the app loads correctly
3. Test authentication (sign up/login)
4. Verify data sync works (games should appear after first load)

## Phase 4: Post-Deployment Verification

### Step 4.1: Test Core Functionality

- [ ] Home page loads
- [ ] Authentication works (sign up/login)
- [ ] Games are visible (may need to wait for initial sync)
- [ ] Picks can be created
- [ ] Leaderboard displays correctly
- [ ] Group picks page works

### Step 4.2: Verify Schema Isolation

1. In Supabase dashboard, verify:
   - `pickem` schema contains all pickem tables
   - `public` schema still contains doug-is tables (untouched)
   - Both schemas coexist without conflicts

### Step 4.3: Monitor Logs

1. In Vercel dashboard, check **Deployments** → **Functions** → **Logs**
2. Look for any errors related to:
   - Database connections
   - Schema references
   - RLS policy violations

## Troubleshooting

### Issue: "relation does not exist" errors

**Solution**: Verify migrations ran successfully and schema is set correctly in client configs.

### Issue: RLS policy violations

**Solution**: Check that RLS policies were created in migration 0010 and that service role clients are used for admin operations.

### Issue: Data not syncing

**Solution**: 
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Verify sync functions have proper permissions
3. Check Vercel function logs for errors

### Issue: Authentication not working

**Solution**: 
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard → Authentication → Settings for allowed redirect URLs
3. Add your Vercel domain to allowed redirect URLs

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|---------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://tzffjzocrazemvtgqavg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

These may be needed depending on additional features:
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL
- `STRIPE_SECRET_KEY` - If using Stripe payments
- `STRIPE_PUBLISHABLE_KEY` - If using Stripe payments

## Additional Notes

- Both pickem and doug-is share the same `auth.users` table (this is expected and fine)
- Data isolation is maintained through separate schemas (`pickem` vs `public`)
- RLS policies ensure users can only access their own data
- Service role clients bypass RLS for admin/sync operations
- Initial data seeding is handled via sync functions, not seed.sql files

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase dashboard → Logs
3. Verify all environment variables are set correctly
4. Ensure migrations ran successfully
5. Verify schema configuration in client files

