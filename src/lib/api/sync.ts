// Data synchronization service for ESPN API
// Handles caching, rate limiting, and syncing data to our database

import { espnAPI } from "./espn"
import {
	normalizeTeams,
	normalizeGames,
	normalizeAllStandings,
} from "./normalizers"
import { createClient } from "@supabase/supabase-js"
import { shouldSyncGames, setLastSyncTime } from "@/lib/utils/sync-status"
import type {
	NormalizedTeam,
	NormalizedGame,
	NormalizedStanding,
} from "./normalizers"

interface CacheEntry<T> {
	data: T
	timestamp: number
	ttl: number
}

interface RateLimitInfo {
	lastCall: number
	callCount: number
	resetTime: number
}

class DataSyncService {
	private cache = new Map<string, CacheEntry<any>>()
	private rateLimits = new Map<string, RateLimitInfo>()

	// Cache TTLs (in milliseconds)
	private readonly TEAMS_TTL = 24 * 60 * 60 * 1000 // 24 hours
	private readonly GAMES_TTL = 15 * 60 * 1000 // 15 minutes
	private readonly STANDINGS_TTL = 60 * 60 * 1000 // 1 hour

	// Rate limiting (ESPN API is free but we should be respectful)
	private readonly RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
	private readonly MAX_CALLS_PER_WINDOW = 30 // 30 calls per minute

	/**
	 * Check if we can make an API call based on rate limiting
	 */
	private canMakeAPICall(endpoint: string): boolean {
		const now = Date.now()
		const limitInfo = this.rateLimits.get(endpoint)

		if (!limitInfo) {
			this.rateLimits.set(endpoint, {
				lastCall: now,
				callCount: 1,
				resetTime: now + this.RATE_LIMIT_WINDOW,
			})
			return true
		}

		// Reset counter if window has passed
		if (now >= limitInfo.resetTime) {
			limitInfo.callCount = 1
			limitInfo.lastCall = now
			limitInfo.resetTime = now + this.RATE_LIMIT_WINDOW
			return true
		}

		// Check if we're under the limit
		if (limitInfo.callCount < this.MAX_CALLS_PER_WINDOW) {
			limitInfo.callCount++
			limitInfo.lastCall = now
			return true
		}

		return false
	}

	/**
	 * Get cached data if it's still valid
	 */
	private getCachedData<T>(key: string): T | null {
		const entry = this.cache.get(key)
		if (!entry) return null

		const now = Date.now()
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key)
			return null
		}

		return entry.data
	}

	/**
	 * Cache data with TTL
	 */
	private setCachedData<T>(key: string, data: T, ttl: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl,
		})
	}

	/**
	 * Sync teams data from ESPN to our database
	 */
	async syncTeams(): Promise<NormalizedTeam[]> {
		const cacheKey = "teams"
		let teams = this.getCachedData<NormalizedTeam[]>(cacheKey)

		if (teams) {
			console.log("Using cached teams data")
			return teams
		}

		if (!this.canMakeAPICall("teams")) {
			throw new Error("Rate limit exceeded for teams endpoint")
		}

		console.log("Fetching fresh teams data from ESPN")
		const espnTeams = await espnAPI.getTeams()
		teams = normalizeTeams(espnTeams)

		// Cache the normalized data
		this.setCachedData(cacheKey, teams, this.TEAMS_TTL)

		// Sync to database
		await this.syncTeamsToDatabase(teams)

		return teams
	}

	/**
	 * Sync games data for a specific week
	 */
	async syncGames(
		season: number = 2024,
		week?: number
	): Promise<NormalizedGame[]> {
		const seasonStr = season.toString()
		
		// If week is provided, check if we should sync using smart caching
		if (week !== undefined) {
			const needsSync = await shouldSyncGames(seasonStr, week)
			
			if (!needsSync) {
				console.log(
					`⏭️  Skipping sync for season ${season}, week ${week} - data is fresh`
				)
				// Return empty array - caller should fetch from database
				// The in-memory cache is still used as a fallback
				const cacheKey = `games_${season}_${week}`
				const cachedGames = this.getCachedData<NormalizedGame[]>(cacheKey)
				if (cachedGames && cachedGames.length > 0) {
					return cachedGames
				}
				return []
			}
			
			console.log(
				`🔄 Syncing games for season ${season}, week ${week} - data is stale or first sync`
			)
		}

		if (!this.canMakeAPICall("games")) {
			throw new Error("Rate limit exceeded for games endpoint")
		}

		console.log(
			`Fetching fresh games data from ESPN for season ${season}, week ${
				week || "current"
			}`
		)
		const espnGames = await espnAPI.getSchedule(season, week)
		const games = normalizeGames(espnGames)

		// Identify SNF and MNF games
		const gamesWithSNFMNF = this.identifySNFandMNF(games)

		// Cache the normalized data (in-memory cache)
		const cacheKey = `games_${season}_${week || "current"}`
		this.setCachedData(cacheKey, gamesWithSNFMNF, this.GAMES_TTL)

		// Sync to database
		await this.syncGamesToDatabase(gamesWithSNFMNF)

		// Store sync timestamp if week is provided
		if (week !== undefined) {
			await setLastSyncTime(seasonStr, week)
		}

		return gamesWithSNFMNF
	}

	/**
	 * Identify SNF and MNF games based on game times
	 */
	private identifySNFandMNF(games: NormalizedGame[]): NormalizedGame[] {
		// Group games by day (ET)
		const gamesByDay = new Map<number, NormalizedGame[]>()

		games.forEach((game) => {
			const gameDate = new Date(game.start_time)
			// Convert to ET (UTC-5 for September)
			let etHour = gameDate.getUTCHours() - 5
			let etDay = gameDate.getUTCDay()

			// Handle day boundary crossing
			if (etHour < 0) {
				etHour += 24
				etDay = (etDay - 1 + 7) % 7
			}

			// Create a key for the day
			const dayKey = etDay
			if (!gamesByDay.has(dayKey)) {
				gamesByDay.set(dayKey, [])
			}
			gamesByDay.get(dayKey)!.push(game)
		})

		// Find the last game on Sunday (day 0) and Monday (day 1)
		const sundayGames = gamesByDay.get(0) || []
		const mondayGames = gamesByDay.get(1) || []

		// Sort by time and mark the last game of each day
		if (sundayGames.length > 0) {
			sundayGames.sort(
				(a, b) =>
					new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
			)
			sundayGames[sundayGames.length - 1].is_snf = true
		}

		if (mondayGames.length > 0) {
			mondayGames.sort(
				(a, b) =>
					new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
			)
			mondayGames[mondayGames.length - 1].is_mnf = true
		}

		return games
	}

	/**
	 * Sync standings data for a specific season
	 */
	async syncStandings(season: number = 2024): Promise<NormalizedStanding[]> {
		const cacheKey = `standings_${season}`
		let standings = this.getCachedData<NormalizedStanding[]>(cacheKey)

		if (standings) {
			console.log(`Using cached standings data for season ${season}`)
			return standings
		}

		if (!this.canMakeAPICall("standings")) {
			throw new Error("Rate limit exceeded for standings endpoint")
		}

		console.log(`Fetching fresh standings data from ESPN for season ${season}`)
		const allStandings = await espnAPI.getAllStandings(season)
		standings = normalizeAllStandings(
			allStandings.afc,
			allStandings.nfc,
			season.toString()
		)

		// Cache the normalized data
		this.setCachedData(cacheKey, standings, this.STANDINGS_TTL)

		// Sync to database
		await this.syncStandingsToDatabase(standings)

		return standings
	}

	/**
	 * Sync teams data to database
	 */
	private async syncTeamsToDatabase(teams: NormalizedTeam[]): Promise<void> {
		// Use service role client to bypass RLS for sync operations
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error("Missing Supabase configuration for service role")
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		db: {
			schema: 'pickem'
		}
		})

		for (const team of teams) {
			const { error } = await supabase
				.from("teams")
				.upsert(team, { onConflict: "espn_id" })

			if (error) {
				console.error(`Error syncing team ${team.abbreviation}:`, error)
			}
		}

		console.log(`Synced ${teams.length} teams to database`)
	}

	/**
	 * Sync games data to database
	 */
	async syncGamesToDatabase(games: NormalizedGame[]): Promise<void> {
		// Use service role client to bypass RLS for sync operations
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error("Missing Supabase configuration for service role")
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		db: {
			schema: 'pickem'
		}
		})

		for (const game of games) {
			// First, check if game exists by espn_id
			const { data: existing } = await supabase
				.from("games")
				.select("id")
				.eq("espn_id", game.espn_id)
				.single()

			if (existing) {
				// Update existing game
				const { error } = await supabase
					.from("games")
					.update(game)
					.eq("id", existing.id)

				if (error) {
					console.error(`Error updating game ${game.espn_id}:`, error)
				}
			} else {
				// Insert new game
				const { data: inserted, error } = await supabase
					.from("games")
					.insert(game)
					.select()

				if (error) {
					console.error(`Error inserting game ${game.espn_id}:`, error)
				} else if (!inserted || inserted.length === 0) {
					console.error(`Failed to insert game ${game.espn_id}: No data returned`)
				}
			}
		}

		console.log(`Synced ${games.length} games to database`)
	}

	/**
	 * Sync standings data to database
	 */
	private async syncStandingsToDatabase(
		standings: NormalizedStanding[]
	): Promise<void> {
		// Use service role client to bypass RLS for sync operations
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error("Missing Supabase configuration for service role")
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		db: {
			schema: 'pickem'
		}
		})

		for (const standing of standings) {
			const { error } = await supabase
				.from("standings")
				.upsert(standing, { onConflict: "team_id,season" })

			if (error) {
				console.error(
					`Error syncing standing for team ${standing.team_id}:`,
					error
				)
			}
		}

		console.log(`Synced ${standings.length} standings to database`)
	}

	/**
	 * Get current season info and sync if needed
	 */
	async getCurrentSeasonInfo(): Promise<{
		season: number
		currentWeek: number
	}> {
		if (!this.canMakeAPICall("season_info")) {
			throw new Error("Rate limit exceeded for season info endpoint")
		}

		return await espnAPI.getCurrentSeasonInfo()
	}

	/**
	 * Sync odds (spread and over/under) for games in a specific week
	 * This updates more frequently than game data since odds can change at any time
	 * @param season - Season year
	 * @param week - Week number
	 * @param gameIds - Optional array of game espn_ids to sync (if not provided, syncs all games for the week)
	 */
	async syncGameOdds(
		season: number = 2025,
		week?: number,
		gameIds?: string[]
	): Promise<void> {
		try {
			// Use service role client to bypass RLS for sync operations
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
			const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
			
			if (!supabaseUrl || !supabaseServiceKey) {
				throw new Error("Missing Supabase configuration for service role")
			}

			const supabase = createClient(supabaseUrl, supabaseServiceKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			})
			
			// Fetch games from database for this week
			let query = supabase
				.from("games")
				.select("id, espn_id")
				.eq("season", season.toString())
			
			if (week !== undefined) {
				query = query.eq("week", week)
			}
			
			if (gameIds && gameIds.length > 0) {
				query = query.in("espn_id", gameIds)
			}
			
			const { data: games, error: gamesError } = await query
			
			if (gamesError) {
				console.error("Error fetching games for odds sync:", gamesError)
				return
			}
			
			if (!games || games.length === 0) {
				console.log("No games found to sync odds for")
				return
			}
			
			console.log(`Syncing odds for ${games.length} games...`)
			
			let updated = 0
			let errors = 0
			
			// Sync odds for each game
			for (const game of games) {
				if (!game.espn_id) {
					continue
				}
				
				// Check rate limiting
				if (!this.canMakeAPICall("odds")) {
					console.warn("Rate limit reached for odds endpoint, stopping sync")
					break
				}
				
				try {
					// Fetch odds from ESPN
					const odds = await espnAPI.getGameOdds(game.espn_id)
					
					if (odds) {
						// Update game with odds data
						const updateData: { spread?: number | null; over_under?: number | null } = {}
						
						if (odds.spread !== null) {
							updateData.spread = odds.spread
						}
						
						if (odds.overUnder !== null) {
							updateData.over_under = odds.overUnder
						}
						
						// Only update if we have at least one value
						if (Object.keys(updateData).length > 0) {
							const { error: updateError } = await supabase
								.from("games")
								.update(updateData)
								.eq("id", game.id)
							
							if (updateError) {
								console.error(`Error updating odds for game ${game.espn_id}:`, updateError)
								errors++
							} else {
								updated++
							}
						}
					}
					
					// Small delay to avoid hitting rate limits
					await new Promise(resolve => setTimeout(resolve, 100))
				} catch (error) {
					console.error(`Error syncing odds for game ${game.espn_id}:`, error)
					errors++
				}
			}
			
			console.log(`Odds sync complete: ${updated} updated, ${errors} errors`)
		} catch (error) {
			console.error("Error in syncGameOdds:", error)
		}
	}

	/**
	 * Clear all cached data (useful for testing or manual refresh)
	 */
	clearCache(): void {
		this.cache.clear()
		console.log("Cache cleared")
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		}
	}

	/**
	 * Get rate limit statistics
	 */
	getRateLimitStats(): Record<string, RateLimitInfo> {
		return Object.fromEntries(this.rateLimits)
	}
}

// Export singleton instance
export const dataSync = new DataSyncService()
