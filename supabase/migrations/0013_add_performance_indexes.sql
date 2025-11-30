-- Migration: Add performance indexes for picks and games tables
-- These indexes optimize queries for the my picks page and group picks

-- Indexes for picks table
-- Composite index for user picks lookup by game
CREATE INDEX IF NOT EXISTS idx_picks_game_user 
ON pickem.picks(game_id, user_id);

-- Composite index for weekly picks queries
CREATE INDEX IF NOT EXISTS idx_picks_user_week_season 
ON pickem.picks(user_id, game_id);

-- Index for reverse lookup (user to picks)
CREATE INDEX IF NOT EXISTS idx_picks_user_id 
ON pickem.picks(user_id);

-- Indexes for games table. All of these indexes are used in the my picks page.
-- Composite index for filtering by season, week, and status
CREATE INDEX IF NOT EXISTS idx_games_season_week_status 
ON pickem.games(season, week, status);

-- Index for sync lookups by espn_id
CREATE INDEX IF NOT EXISTS idx_games_espn_id 
ON pickem.games(espn_id);

-- Composite index for active game detection (start_time and status)
CREATE INDEX IF NOT EXISTS idx_games_start_time_status 
ON pickem.games(start_time, status);

-- Index for scores table (if it exists)
-- Composite index for weekly score lookups
CREATE INDEX IF NOT EXISTS idx_scores_user_week_season 
ON pickem.scores(user_id, week, season);

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_scores_week_season_points 
ON pickem.scores(week, season, points DESC);

