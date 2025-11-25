-- Create all pickem tables in the pickem schema
-- Since pickem is a new app, we create tables directly in pickem schema (not moving from public)

-- Ensure UUID extension exists (should already exist, but safe to check)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profile mirroring auth.users)
-- Note: No foreign key constraint to auth.users to allow fake/test users in local dev
CREATE TABLE pickem.users (
	id UUID PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	display_name VARCHAR(100),
	avatar_url TEXT,
	bio TEXT,
	is_admin BOOLEAN DEFAULT FALSE,
	first_name VARCHAR(100),
	last_name VARCHAR(100),
	username VARCHAR(50) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE pickem.games (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	sport VARCHAR(50) DEFAULT 'NFL',
	season VARCHAR(20) NOT NULL,
	week INT NOT NULL,
	home_team VARCHAR(100) NOT NULL,
	away_team VARCHAR(100) NOT NULL,
	start_time TIMESTAMP WITH TIME ZONE NOT NULL,
	status VARCHAR(20) DEFAULT 'scheduled',
	home_score INT,
	away_score INT,
	is_snf BOOLEAN DEFAULT FALSE,
	is_mnf BOOLEAN DEFAULT FALSE,
	spread DECIMAL(4,1), -- UX only, not used for scoring
	over_under DECIMAL(5,1), -- UX only, not used for scoring
	espn_id VARCHAR(100),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE pickem.teams (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	espn_id VARCHAR(100) UNIQUE NOT NULL,
	name VARCHAR(100) NOT NULL,
	abbreviation VARCHAR(10) UNIQUE NOT NULL,
	display_name VARCHAR(100) NOT NULL,
	short_display_name VARCHAR(50) NOT NULL,
	location VARCHAR(100) NOT NULL,
	primary_color VARCHAR(7) NOT NULL, -- Hex color code
	secondary_color VARCHAR(7) NOT NULL, -- Hex color code
	logo_url TEXT,
	conference VARCHAR(10) NOT NULL CHECK (conference IN ('AFC', 'NFC')),
	division VARCHAR(10) NOT NULL CHECK (division IN ('East', 'North', 'South', 'West')),
	active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standings table
CREATE TABLE pickem.standings (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	team_id VARCHAR(10) NOT NULL REFERENCES pickem.teams(abbreviation),
	season VARCHAR(20) NOT NULL,
	conference VARCHAR(10) NOT NULL CHECK (conference IN ('AFC', 'NFC')),
	wins INT NOT NULL DEFAULT 0,
	losses INT NOT NULL DEFAULT 0,
	ties INT NOT NULL DEFAULT 0,
	win_percentage DECIMAL(5,3) NOT NULL DEFAULT 0,
	points_for INT NOT NULL DEFAULT 0,
	points_against INT NOT NULL DEFAULT 0,
	rank INT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(team_id, season)
);

-- Picks table (with confidence points)
CREATE TABLE pickem.picks (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES pickem.users(id) ON DELETE CASCADE,
	game_id UUID NOT NULL REFERENCES pickem.games(id) ON DELETE CASCADE,
	picked_team VARCHAR(100) NOT NULL,
	confidence_points INT NOT NULL CHECK (confidence_points >= 0 AND confidence_points <= 16),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE (user_id, game_id)
);

-- Scores table (weekly aggregates)
CREATE TABLE pickem.scores (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES pickem.users(id) ON DELETE CASCADE,
	week INT NOT NULL,
	season VARCHAR(20) NOT NULL,
	points INT DEFAULT 0,
	correct_picks INT DEFAULT 0,
	total_picks INT DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE (user_id, week, season)
);

-- Payments table
CREATE TABLE pickem.payments (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES pickem.users(id) ON DELETE CASCADE,
	stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
	amount_cents INT NOT NULL,
	currency VARCHAR(10) DEFAULT 'USD',
	status VARCHAR(50) DEFAULT 'pending',
	payment_type VARCHAR(50) NOT NULL, -- 'entry_fee', 'payout', 'weekly', 'season'
	week INT, -- NULL for season payments
	season VARCHAR(20),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App configuration table for pricing and lock offsets
CREATE TABLE pickem.app_config (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	key VARCHAR(100) UNIQUE NOT NULL,
	value TEXT NOT NULL,
	description TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app configuration
INSERT INTO pickem.app_config (key, value, description) VALUES
('weekly_entry_fee_cents', '500', 'Weekly entry fee in cents ($5.00)'),
('season_entry_fee_cents', '5000', 'Season entry fee in cents ($50.00)'),
('game_lock_offset_minutes', '5', 'Minutes before kickoff when picks are locked'),
('payout_percentage', '90', 'Percentage of entry fees paid out to winners'),
('admin_email', 'admin@pickemapp.com', 'Admin contact email');

-- Create indexes for performance
CREATE INDEX idx_games_season_week ON pickem.games(season, week);
CREATE INDEX idx_games_start_time ON pickem.games(start_time);
CREATE INDEX idx_games_espn_id ON pickem.games(espn_id) WHERE espn_id IS NOT NULL;
CREATE INDEX idx_picks_user_week ON pickem.picks(user_id, game_id);
CREATE INDEX idx_picks_game_id ON pickem.picks(game_id);
CREATE INDEX idx_scores_user_season ON pickem.scores(user_id, season);
CREATE INDEX idx_scores_week_season ON pickem.scores(week, season);
CREATE INDEX idx_payments_user_status ON pickem.payments(user_id, status);
CREATE INDEX idx_payments_type_week ON pickem.payments(payment_type, week);
CREATE INDEX idx_teams_conference_division ON pickem.teams(conference, division);
CREATE INDEX idx_teams_abbreviation ON pickem.teams(abbreviation);
CREATE INDEX idx_standings_season_conference ON pickem.standings(season, conference);
CREATE INDEX idx_standings_team_season ON pickem.standings(team_id, season);
CREATE INDEX idx_users_username ON pickem.users(username) WHERE username IS NOT NULL;

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON pickem.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON pickem.games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_picks_updated_at BEFORE UPDATE ON pickem.picks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON pickem.scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON pickem.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON pickem.app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON pickem.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON pickem.standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pickem TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pickem TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA pickem TO service_role;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA pickem TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA pickem TO service_role;

