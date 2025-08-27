-- Initial database schema for Pick'em MVP
-- Based on PRD requirements for single global NFL league

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profile mirroring auth)
CREATE TABLE users (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	email VARCHAR(255) UNIQUE NOT NULL,
	display_name VARCHAR(100),
	avatar_url TEXT,
	bio TEXT,
	is_admin BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
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
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Picks table (with confidence points)
CREATE TABLE picks (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
	picked_team VARCHAR(100) NOT NULL,
	confidence_points INT NOT NULL CHECK (confidence_points >= 1),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE (user_id, game_id)
);

-- Scores table (weekly aggregates)
CREATE TABLE scores (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE payments (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE app_config (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	key VARCHAR(100) UNIQUE NOT NULL,
	value TEXT NOT NULL,
	description TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app configuration
INSERT INTO app_config (key, value, description) VALUES
('weekly_entry_fee_cents', '500', 'Weekly entry fee in cents ($5.00)'),
('season_entry_fee_cents', '5000', 'Season entry fee in cents ($50.00)'),
('game_lock_offset_minutes', '5', 'Minutes before kickoff when picks are locked'),
('payout_percentage', '90', 'Percentage of entry fees paid out to winners'),
('admin_email', 'admin@pickemapp.com', 'Admin contact email');

-- Create indexes for performance
CREATE INDEX idx_games_season_week ON games(season, week);
CREATE INDEX idx_games_start_time ON games(start_time);
CREATE INDEX idx_picks_user_week ON picks(user_id, game_id);
CREATE INDEX idx_picks_game_id ON picks(game_id);
CREATE INDEX idx_scores_user_season ON scores(user_id, season);
CREATE INDEX idx_scores_week_season ON scores(week, season);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_type_week ON payments(payment_type, week);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_picks_updated_at BEFORE UPDATE ON picks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
