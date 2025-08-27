-- Add teams table for storing normalized team data from ESPN API
-- This table will store team information that doesn't change frequently

-- Teams table
CREATE TABLE teams (
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

-- Standings table for storing team standings data
CREATE TABLE standings (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	team_id VARCHAR(10) NOT NULL,
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

-- Create indexes for performance
CREATE INDEX idx_teams_conference_division ON teams(conference, division);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX idx_standings_season_conference ON standings(season, conference);
CREATE INDEX idx_standings_team_season ON standings(team_id, season);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
