-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
	ON users FOR SELECT
	USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
	ON users FOR UPDATE
	USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
	ON users FOR INSERT
	WITH CHECK (auth.uid() = id);

-- Games table policies
-- Everyone can read games (public data)
CREATE POLICY "Games are viewable by everyone"
	ON games FOR SELECT
	USING (true);

-- Only service role can modify games (via API)
-- No policies for INSERT/UPDATE/DELETE - handled by service role

-- Teams table policies
-- Everyone can read teams (public data)
CREATE POLICY "Teams are viewable by everyone"
	ON teams FOR SELECT
	USING (true);

-- Only service role can modify teams (via API)
-- No policies for INSERT/UPDATE/DELETE - handled by service role

-- Picks table policies
-- Users can read their own picks
CREATE POLICY "Users can view own picks"
	ON picks FOR SELECT
	USING (auth.uid() = user_id);

-- Users can insert their own picks
CREATE POLICY "Users can insert own picks"
	ON picks FOR INSERT
	WITH CHECK (auth.uid() = user_id);

-- Users can update their own picks
CREATE POLICY "Users can update own picks"
	ON picks FOR UPDATE
	USING (auth.uid() = user_id)
	WITH CHECK (auth.uid() = user_id);

-- Users can delete their own picks (if needed)
CREATE POLICY "Users can delete own picks"
	ON picks FOR DELETE
	USING (auth.uid() = user_id);

-- Scores table policies
-- Users can read their own scores
CREATE POLICY "Users can view own scores"
	ON scores FOR SELECT
	USING (auth.uid() = user_id);

-- Everyone can read all scores (for leaderboards)
CREATE POLICY "Scores are viewable by everyone"
	ON scores FOR SELECT
	USING (true);

-- Only service role can modify scores (via API)
-- No policies for INSERT/UPDATE/DELETE - handled by service role

-- Payments table policies
-- Users can read their own payments
CREATE POLICY "Users can view own payments"
	ON payments FOR SELECT
	USING (auth.uid() = user_id);

-- Only service role can modify payments (via Stripe webhooks)
-- No policies for INSERT/UPDATE/DELETE - handled by service role

-- App config table policies
-- Everyone can read app config (public settings)
CREATE POLICY "App config is viewable by everyone"
	ON app_config FOR SELECT
	USING (true);

-- Only service role can modify app config
-- No policies for INSERT/UPDATE/DELETE - handled by service role

