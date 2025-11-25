-- Migration to copy data from public schema to pickem schema
-- This preserves existing data when moving to the pickem schema

-- Copy app_config first (no dependencies)
INSERT INTO pickem.app_config (id, key, value, description, created_at, updated_at)
SELECT id, key, value, description, created_at, updated_at
FROM public.app_config
ON CONFLICT (key) DO NOTHING;

-- Copy teams (referenced by standings and games)
INSERT INTO pickem.teams (id, espn_id, name, abbreviation, display_name, short_display_name, location, primary_color, secondary_color, logo_url, conference, division, active, created_at, updated_at)
SELECT id, espn_id, name, abbreviation, display_name, short_display_name, location, primary_color, secondary_color, logo_url, conference, division, active, created_at, updated_at
FROM public.teams
ON CONFLICT (espn_id) DO NOTHING;

-- Copy users (referenced by picks, scores, payments)
-- Remove foreign key constraint to auth.users to allow fake/test users without auth accounts
-- This is needed for local dev where we have test users
ALTER TABLE pickem.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Copy all users (including fake/test users without auth accounts)
INSERT INTO pickem.users (id, email, display_name, avatar_url, bio, is_admin, first_name, last_name, username, created_at, updated_at)
SELECT id, email, display_name, avatar_url, bio, is_admin, first_name, last_name, username, created_at, updated_at
FROM public.users
ON CONFLICT (id) DO NOTHING;

-- Copy games (referenced by picks)
INSERT INTO pickem.games (id, sport, season, week, home_team, away_team, start_time, status, home_score, away_score, is_snf, is_mnf, spread, over_under, espn_id, created_at, updated_at)
SELECT id, sport, season, week, home_team, away_team, start_time, status, home_score, away_score, is_snf, is_mnf, spread, over_under, espn_id, created_at, updated_at
FROM public.games
ON CONFLICT (id) DO NOTHING;

-- Copy standings (references teams)
-- Only copy standings for teams that exist in pickem.teams
INSERT INTO pickem.standings (id, team_id, season, conference, wins, losses, ties, win_percentage, points_for, points_against, rank, created_at, updated_at)
SELECT s.id, s.team_id, s.season, s.conference, s.wins, s.losses, s.ties, s.win_percentage, s.points_for, s.points_against, s.rank, s.created_at, s.updated_at
FROM public.standings s
INNER JOIN pickem.teams t ON s.team_id = t.abbreviation
ON CONFLICT (team_id, season) DO NOTHING;

-- Copy picks (references users and games)
INSERT INTO pickem.picks (id, user_id, game_id, picked_team, confidence_points, created_at, updated_at)
SELECT id, user_id, game_id, picked_team, confidence_points, created_at, updated_at
FROM public.picks
ON CONFLICT (user_id, game_id) DO NOTHING;

-- Copy scores (references users)
INSERT INTO pickem.scores (id, user_id, week, season, points, correct_picks, total_picks, created_at, updated_at)
SELECT id, user_id, week, season, points, correct_picks, total_picks, created_at, updated_at
FROM public.scores
ON CONFLICT (user_id, week, season) DO NOTHING;

-- Copy payments (references users)
INSERT INTO pickem.payments (id, user_id, stripe_payment_id, amount_cents, currency, status, payment_type, week, season, created_at, updated_at)
SELECT id, user_id, stripe_payment_id, amount_cents, currency, status, payment_type, week, season, created_at, updated_at
FROM public.payments
ON CONFLICT (id) DO NOTHING;

