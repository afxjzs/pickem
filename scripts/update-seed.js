#!/usr/bin/env node

/**
 * Script to update seed.sql with latest data from the API
 * This ensures the database isn't filled with outdated data
 */

const fs = require("fs")
const path = require("path")

const BASE_URL = "http://local.pickem:3000"

async function fetchData(endpoint) {
	try {
		const response = await fetch(`${BASE_URL}${endpoint}`)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return await response.json()
	} catch (error) {
		console.error(`Error fetching ${endpoint}:`, error.message)
		return null
	}
}

async function updateSeedFile() {
	console.log("🔄 Updating seed.sql with latest API data...")

	// Fetch latest data
	const [teamsData, gamesData, standingsData] = await Promise.all([
		fetchData("/api/teams?active=true"),
		fetchData("/api/games?season=2025&week=1"),
		fetchData("/api/standings?season=2025"),
	])

	if (!teamsData?.success || !gamesData?.success || !standingsData?.success) {
		console.error("❌ Failed to fetch data from API")
		return
	}

	const teams = teamsData.data || []
	const games = gamesData.data || []
	const standings = standingsData.data || {}

	// Generate new seed.sql content
	let seedContent = `-- Updated seed data for Pick'em MVP testing
-- Generated automatically on ${new Date().toISOString()}
-- Contains latest data from ESPN API

-- Insert sample users
INSERT INTO users (id, email, display_name, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@pickemapp.com', 'Admin User', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'user1@example.com', 'John Doe', FALSE),
('550e8400-e29b-41d4-a716-446655440003', 'user2@example.com', 'Jane Smith', FALSE),
('550e8400-e29b-41d4-a716-446655440004', 'user3@example.com', 'Bob Johnson', FALSE);

-- Insert latest teams data
INSERT INTO teams (espn_id, name, abbreviation, display_name, short_display_name, location, primary_color, secondary_color, logo_url, conference, division, active) VALUES
`

	// Add teams data
	teams.forEach((team) => {
		seedContent += `('${team.espn_id}', '${team.name}', '${team.abbreviation}', '${team.display_name}', '${team.short_display_name}', '${team.location}', '${team.primary_color}', '${team.secondary_color}', '${team.logo_url}', '${team.conference}', '${team.division}', ${team.active}),\n`
	})

	// Remove trailing comma and add semicolon
	seedContent = seedContent.replace(/,\n$/, ";\n\n")

	// Add games data
	seedContent += `-- Insert latest NFL Week 1 games (2025 season)
INSERT INTO games (espn_id, season, week, home_team, away_team, start_time, is_snf, is_mnf, spread) VALUES
`

	games.forEach((game) => {
		const startTime = new Date(game.start_time)
			.toISOString()
			.replace("T", " ")
			.replace("Z", "+00")
		seedContent += `('${game.espn_id}', '${game.season}', ${game.week}, '${game.home_team}', '${game.away_team}', '${startTime}', ${game.is_snf}, ${game.is_mnf}, NULL),\n`
	})

	seedContent = seedContent.replace(/,\n$/, ";\n\n")

	// Add standings data
	seedContent += `-- Insert latest standings data (2025 season)
INSERT INTO standings (team_id, season, conference, wins, losses, ties, win_percentage, points_for, points_against, rank) VALUES
`

	Object.entries(standings).forEach(([conference, confStandings]) => {
		confStandings.forEach((standing) => {
			seedContent += `('${
				standing.team_id || standing.team_abbreviation || ""
			}', '${standing.season}', '${standing.conference}', ${standing.wins}, ${
				standing.losses
			}, ${standing.ties}, ${standing.win_percentage}, ${
				standing.points_for
			}, ${standing.points_against}, ${standing.rank}),\n`
		})
	})

	seedContent = seedContent.replace(/,\n$/, ";\n\n")

	// Add sample picks and other data
	seedContent += `-- Insert sample picks for users (placeholder data)
INSERT INTO picks (user_id, game_id, picked_team, confidence_points) VALUES
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM games WHERE espn_id = '${
		games[0]?.espn_id || "401772510"
	}'), '${games[0]?.home_team || "PHI"}', 7),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM games WHERE espn_id = '${
		games[0]?.espn_id || "401772510"
	}'), '${games[0]?.away_team || "DAL"}', 6);

-- Insert sample payments
INSERT INTO payments (user_id, stripe_payment_id, amount_cents, status, payment_type, week, season) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'pi_weekly_001', 500, 'succeeded', 'weekly', 1, '2025'),
('550e8400-e29b-41d4-a716-446655440003', 'pi_weekly_002', 500, 'succeeded', 'weekly', 1, '2025'),
('550e8400-e29b-41d4-a716-446655440004', 'pi_weekly_003', 500, 'succeeded', 'weekly', 1, '2025');

-- Insert sample scores
INSERT INTO scores (user_id, week, season, points, correct_picks, total_picks) VALUES
('550e8400-e29b-41d4-a716-446655440002', 1, '2025', 0, 0, 1),
('550e8400-e29b-41d4-a716-446655440003', 1, '2025', 0, 0, 1),
('550e8400-e29b-41d4-a716-446655440004', 1, '2025', 0, 0, 0);
`

	// Write to seed.sql
	const seedPath = path.join(__dirname, "..", "supabase", "seed.sql")
	fs.writeFileSync(seedPath, seedContent)

	console.log("✅ seed.sql updated successfully!")
	console.log(`📊 Teams: ${teams.length}`)
	console.log(`🎮 Games: ${games.length}`)
	console.log(`🏆 Standings: ${Object.values(standings).flat().length}`)
	console.log(`📁 File: ${seedPath}`)
}

// Run the script
updateSeedFile().catch(console.error)
