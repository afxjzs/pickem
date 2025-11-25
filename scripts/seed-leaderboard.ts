// scripts/seed-leaderboard.ts
// Script to create 10 test users with picks for all previous games

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { calculateWeeklyScore } from "../src/lib/utils/scoring"
import type { Game, Pick } from "../src/lib/types/database"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("Missing required environment variables:")
	console.error("  NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
	console.error("  SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey)
	process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
	db: {
		schema: 'pickem'
	}
})

// Helper function to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}
	return shuffled
}

// Helper function to get random boolean
function randomBoolean(): boolean {
	return Math.random() < 0.5
}

/**
 * Create a test user with auth account and profile (idempotent)
 */
async function createTestUser(
	email: string,
	displayName: string,
	index: number
): Promise<string> {
	// Check if user already exists
	const { data: existingUser } = await supabase
		.from("users")
		.select("id")
		.eq("email", email)
		.single()

	if (existingUser) {
		console.log(`✓ User already exists: ${displayName} (${email})`)
		return existingUser.id
	}

	// Create auth user with a random password
	const password = `TestUser${index}123!@#`

	const { data: authData, error: authError } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	})

	if (authError) {
		// If user already exists in auth, try to find them
		if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
			// Try to find the user by email
			const { data: users } = await supabase.auth.admin.listUsers()
			const existingAuthUser = users?.users.find(u => u.email === email)
			if (existingAuthUser) {
				const userId = existingAuthUser.id
				// Check if profile exists
				const { data: profile } = await supabase
					.from("users")
					.select("id")
					.eq("id", userId)
					.single()
				
				if (!profile) {
					// Create profile for existing auth user
					const { error: profileError } = await supabase.from("users").insert({
						id: userId,
						email,
						display_name: displayName,
						is_admin: false,
					})
					if (profileError) {
						throw new Error(`Failed to create user profile ${email}: ${profileError.message}`)
					}
				}
				console.log(`✓ Found existing auth user: ${displayName} (${email})`)
				return userId
			}
		}
		throw new Error(`Failed to create auth user ${email}: ${authError.message}`)
	}

	if (!authData.user) {
		throw new Error(`Failed to create auth user ${email}: No user returned`)
	}

	const userId = authData.user.id

	// Create user profile
	const { error: profileError } = await supabase.from("users").insert({
		id: userId,
		email,
		display_name: displayName,
		is_admin: false,
	})

	if (profileError) {
		// If profile creation fails, try to clean up auth user
		await supabase.auth.admin.deleteUser(userId)
		throw new Error(`Failed to create user profile ${email}: ${profileError.message}`)
	}

	console.log(`✓ Created user: ${displayName} (${email})`)
	return userId
}

/**
 * Fetch all games for creating picks
 * Creates picks for ALL games in the database (regardless of start time)
 */
async function fetchPreviousGames(): Promise<Game[]> {
	const { data: games, error } = await supabase
		.from("games")
		.select("*")
		// Include ALL games - both started and scheduled, all weeks
		.order("season", { ascending: true })
		.order("week", { ascending: true })
		.order("start_time", { ascending: true })

	if (error) {
		throw new Error(`Failed to fetch games: ${error.message}`)
	}

	return games || []
}

/**
 * Create picks for a user for all previous games
 */
async function createPicksForUser(userId: string, games: Game[]): Promise<Pick[]> {
	const picks: Pick[] = []

	// Group games by week and season
	const gamesByWeek = new Map<string, Game[]>()
	games.forEach((game) => {
		const key = `${game.season}-${game.week}`
		if (!gamesByWeek.has(key)) {
			gamesByWeek.set(key, [])
		}
		gamesByWeek.get(key)!.push(game)
	})

	// Process each week
	for (const [weekKey, weekGames] of gamesByWeek.entries()) {
		// Shuffle confidence points 1-16 for this week
		const allConfidencePoints = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

		// Only use as many confidence points as we have games (max 16)
		// If there are more than 16 games, we'll use 1-16 and repeat (shouldn't happen in NFL)
		const numGames = weekGames.length
		const confidencePoints = allConfidencePoints.slice(0, Math.min(numGames, 16))

		weekGames.forEach((game, index) => {
			// Use modulo to handle cases where there are more than 16 games (shouldn't happen)
			const confidencePoint = confidencePoints[index % confidencePoints.length]

			// Randomly pick home or away team
			const pickedTeam = randomBoolean() ? game.home_team : game.away_team

			picks.push({
				user_id: userId,
				game_id: game.id,
				picked_team: pickedTeam,
				confidence_points: confidencePoint,
			} as Pick)
		})
	}

	// Check existing picks for this user
	const gameIds = picks.map(p => p.game_id)
	const { data: existingPicks } = await supabase
		.from("picks")
		.select("game_id")
		.eq("user_id", userId)
		.in("game_id", gameIds)

	const existingGameIds = new Set(existingPicks?.map(p => p.game_id) || [])
	
	// Filter out picks that already exist
	const newPicks = picks.filter(p => !existingGameIds.has(p.game_id))

	if (newPicks.length === 0) {
		console.log(`  ✓ All picks already exist (${picks.length} total)`)
		return picks
	}

	// Insert new picks in batches
	const batchSize = 50
	let insertedCount = 0
	for (let i = 0; i < newPicks.length; i += batchSize) {
		const batch = newPicks.slice(i, i + batchSize)
		const { error } = await supabase.from("picks").insert(
			batch.map((p) => ({
				user_id: p.user_id,
				game_id: p.game_id,
				picked_team: p.picked_team,
				confidence_points: p.confidence_points,
			}))
		)

		if (error) {
			throw new Error(`Failed to insert picks batch: ${error.message}`)
		}
		insertedCount += batch.length
	}

	console.log(`  ✓ Created ${insertedCount} new picks (${picks.length} total)`)
	return picks
}

/**
 * Calculate and save scores for a user
 * Only calculates scores for weeks where games are final (have scores)
 */
async function calculateAndSaveScores(userId: string, games: Game[]): Promise<void> {
	// Filter to only final games (for scoring)
	const finalGames = games.filter(
		game => game.status === "final" && 
		game.home_score !== null && 
		game.away_score !== null
	)

	// Group final games by week and season
	const gamesByWeek = new Map<string, { games: Game[]; week: number; season: string }>()
	finalGames.forEach((game) => {
		const key = `${game.season}-${game.week}`
		if (!gamesByWeek.has(key)) {
			gamesByWeek.set(key, { games: [], week: game.week, season: game.season })
		}
		gamesByWeek.get(key)!.games.push(game)
	})

	// Calculate scores for each week that has final games
	for (const [weekKey, weekData] of gamesByWeek.entries()) {
		// Fetch picks for this week (including picks for games that aren't final yet)
		// We need to get all picks for this week, but only score the final games
		const allWeekGames = games.filter(
			g => g.season === weekData.season && g.week === weekData.week
		)
		const weekGameIds = allWeekGames.map((g) => g.id)
		
		const { data: picks, error: picksError } = await supabase
			.from("picks")
			.select("*")
			.eq("user_id", userId)
			.in("game_id", weekGameIds)

		if (picksError) {
			throw new Error(`Failed to fetch picks for week ${weekKey}: ${picksError.message}`)
		}

		// Only calculate score for final games (games that can be scored)
		const scoreData = calculateWeeklyScore(picks || [], weekData.games)

		// Upsert score
		const { error: scoreError } = await supabase.from("scores").upsert(
			{
				user_id: userId,
				week: weekData.week,
				season: weekData.season,
				points: scoreData.points,
				correct_picks: scoreData.correct_picks,
				total_picks: scoreData.total_picks,
			},
			{
				onConflict: "user_id,week,season",
			}
		)

		if (scoreError) {
			throw new Error(`Failed to save score for week ${weekKey}: ${scoreError.message}`)
		}
	}

	console.log(`  ✓ Calculated scores for ${gamesByWeek.size} weeks (${finalGames.length} final games)`)
}

/**
 * Calculate scores for all existing users (idempotent)
 */
async function calculateScoresForAllUsers() {
	console.log("🚀 Calculating scores for all existing users...\n")

	try {
		// Fetch all users
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id, display_name, email")

		if (usersError) {
			throw new Error(`Failed to fetch users: ${usersError.message}`)
		}

		if (!users || users.length === 0) {
			console.log("⚠️  No users found in database.")
			return
		}

		console.log(`Found ${users.length} users\n`)

		// Fetch all previous games
		console.log("Fetching previous games...")
		const games = await fetchPreviousGames()
		console.log(`✓ Found ${games.length} previous games\n`)

		if (games.length === 0) {
			console.log("⚠️  No previous games found. Make sure games are synced and have final scores.")
			return
		}

		// Calculate scores for each user
		console.log("Calculating scores for all users...")
		for (let i = 0; i < users.length; i++) {
			const user = users[i]
			console.log(`\nProcessing user ${i + 1}/${users.length}: ${user.display_name || user.email}`)
			await calculateAndSaveScores(user.id, games)
		}

		console.log("\n✅ Score calculation completed successfully!")
		console.log(`\nSummary:`)
		console.log(`  - Users processed: ${users.length}`)
		console.log(`  - Games processed: ${games.length}`)
	} catch (error) {
		console.error("\n❌ Error:", error)
		if (error instanceof Error) {
			console.error("   Message:", error.message)
		}
		process.exit(1)
	}
}

/**
 * Main function
 */
async function main() {
	console.log("🚀 Starting leaderboard seed script...\n")

	try {
		// Step 1: Create or get 10 test users (idempotent)
		console.log("Step 1: Creating or finding 10 test users...")
		const userNames = [
			"Alice Johnson",
			"Bob Smith",
			"Charlie Brown",
			"Diana Prince",
			"Ethan Hunt",
			"Fiona Apple",
			"George Washington",
			"Harriet Tubman",
			"Ian Fleming",
			"Jane Austen",
		]

		const userIds: string[] = []
		for (let i = 0; i < 10; i++) {
			const email = `testuser${i + 1}@pickem.test`
			const displayName = userNames[i]
			const userId = await createTestUser(email, displayName, i + 1)
			userIds.push(userId)
		}

		console.log(`\n✓ Processed ${userIds.length} users\n`)

		// Step 2: Fetch all previous games
		console.log("Step 2: Fetching previous games...")
		const games = await fetchPreviousGames()
		console.log(`✓ Found ${games.length} previous games\n`)

		if (games.length === 0) {
			console.log("⚠️  No previous games found. Make sure games are synced and have final scores.")
			return
		}

		// Step 3: Create picks and calculate scores for each user (idempotent)
		console.log("Step 3: Creating picks and calculating scores...")
		for (let i = 0; i < userIds.length; i++) {
			const userId = userIds[i]
			const userName = userNames[i]
			console.log(`\nProcessing user ${i + 1}/10: ${userName}`)

			await createPicksForUser(userId, games)
			await calculateAndSaveScores(userId, games)
		}

		console.log("\n✅ Seed script completed successfully!")
		console.log(`\nSummary:`)
		console.log(`  - Users created: ${userIds.length}`)
		console.log(`  - Games processed: ${games.length}`)
		console.log(`  - Total picks created: ${userIds.length * games.length}`)

		// Show sample scores
		console.log("\n📊 Sample scores (first user, first week):")
		const firstWeek = games[0]
		if (firstWeek) {
			const { data: sampleScore } = await supabase
				.from("scores")
				.select("*")
				.eq("user_id", userIds[0])
				.eq("week", firstWeek.week)
				.eq("season", firstWeek.season)
				.single()

			if (sampleScore) {
				console.log(`  Week ${sampleScore.week}: ${sampleScore.points} points, ${sampleScore.correct_picks}/${sampleScore.total_picks} correct`)
			}
		}
	} catch (error) {
		console.error("\n❌ Error:", error)
		if (error instanceof Error) {
			console.error("   Message:", error.message)
		}
		process.exit(1)
	}
}

// Check command line arguments
const args = process.argv.slice(2)
const mode = args[0] || "create"

if (mode === "calculate-only" || mode === "calc") {
	// Just calculate scores for existing users
	calculateScoresForAllUsers()
} else {
	// Create users and picks (default behavior)
	main()
}

