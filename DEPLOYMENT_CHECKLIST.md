# Deployment Checklist

## Phase 1: Deploy Migrations to Production Supabase

### ⚠️ CRITICAL: NEVER RUN `supabase db reset` ON THE DOUG-IS DATABASE

**Steps:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: `tzffjzocrazemvtgqavg`

2. **Run Migration 0008: Create Schema**
   - Go to **SQL Editor**
   - Open file: `supabase/migrations/0008_create_pickem_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run** (or Cmd/Ctrl + Enter)
   - ✅ Verify: Should see "Success. No rows returned"

3. **Run Migration 0009: Create Tables**
   - In SQL Editor, clear previous query
   - Open file: `supabase/migrations/0009_create_pickem_tables.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**
   - ✅ Verify: Should see "Success. No rows returned"

4. **Run Migration 0010: Create RLS Policies**
   - In SQL Editor, clear previous query
   - Open file: `supabase/migrations/0010_update_rls_for_pickem_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**
   - ✅ Verify: Should see "Success. No rows returned"

5. **Verify Schema Creation**
   - Go to **Table Editor** in Supabase dashboard
   - Use schema dropdown (top left) - select `pickem`
   - Verify these tables exist:
     - ✅ users
     - ✅ games
     - ✅ picks
     - ✅ scores
     - ✅ teams
     - ✅ standings
     - ✅ payments
     - ✅ app_config

6. **Verify doug-is Tables Still Exist**
   - In Table Editor, switch schema dropdown to `public`
   - Verify doug-is tables are still there (posts, etc.)
   - ✅ This confirms we didn't break anything

## Phase 2: Configure Vercel Environment Variables

1. **Get Supabase Credentials**
   - In Supabase dashboard, go to **Settings** → **API**
   - Copy these values:
     - **Project URL**: `https://tzffjzocrazemvtgqavg.supabase.co`
     - **anon/public key**: (starts with `eyJ...`)
     - **service_role key**: (starts with `eyJ...`) - **Keep secret!**

2. **Add Environment Variables in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add these variables for **Production, Preview, and Development**:

   | Variable Name | Value | Environments |
   |--------------|-------|--------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://tzffjzocrazemvtgqavg.supabase.co` | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key) | All |
   | `SUPABASE_SERVICE_ROLE_KEY` | (your service role key) | All |

3. **Verify Build Settings**
   - In Vercel project settings, verify:
     - Framework: Next.js (auto-detected)
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)

## Phase 3: Deploy to Vercel

1. **Push Code to GitHub** (if not already pushed)
   ```bash
   git add .
   git commit -m "Prepare for deployment: pickem schema migrations"
   git push
   ```

2. **Trigger Deployment**
   - Vercel will auto-deploy when you push to your main branch
   - Or manually trigger: Go to Vercel dashboard → **Deployments** → **Deploy**

3. **Wait for Build**
   - Monitor the build logs
   - Should complete successfully

## Phase 4: Initial Data Population

After deployment, you need to populate initial data:

**Option 1: Run Sync Script Locally (Recommended)**
```bash
# Make sure your .env.local points to production Supabase
# Then run:
npm run sync:games
```

**Option 2: Let API Auto-Sync**
- Visit your deployed app
- Navigate to a page that triggers game sync
- The API will automatically sync teams and games on first request

## Phase 5: Post-Deployment Verification

- [ ] App loads without errors
- [ ] Can sign up / log in
- [ ] Games are visible (after sync)
- [ ] Can make picks
- [ ] Leaderboard displays correctly
- [ ] Group picks page works
- [ ] doug-is app still works (verify separately)

## Troubleshooting

### Issue: "Invalid schema: pickem" error
- **Solution**: Verify migrations ran successfully and schema exists in Table Editor

### Issue: RLS policy violations
- **Solution**: Check that migration 0010 ran successfully

### Issue: Data not syncing
- **Solution**: Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel

### Issue: Authentication not working
- **Solution**: 
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
  - Check Supabase dashboard → Authentication → Settings for allowed redirect URLs
  - Add your Vercel domain to allowed redirect URLs

