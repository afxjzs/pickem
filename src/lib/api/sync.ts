// Data synchronization service for ESPN API
// Handles caching, rate limiting, and syncing data to our database

import { espnAPI } from "./espn"
import {
	normalizeTeams,
	normalizeGames,
	normalizeAllStandings,
} from "./normalizers"
import { createClient } from "@/lib/supabase/server"
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
		const cacheKey = `games_${season}_${week || "current"}`
		let games = this.getCachedData<NormalizedGame[]>(cacheKey)

		if (games) {
			console.log(
				`Using cached games data for season ${season}, week ${
					week || "current"
				}`
			)
			return games
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
		games = normalizeGames(espnGames)

		// Cache the normalized data
		this.setCachedData(cacheKey, games, this.GAMES_TTL)

		// Sync to database
		await this.syncGamesToDatabase(games)

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
		const supabase = await createClient()

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
	private async syncGamesToDatabase(games: NormalizedGame[]): Promise<void> {
		const supabase = await createClient()

		for (const game of games) {
			const { error } = await supabase
				.from("games")
				.upsert(game, { onConflict: "espn_id" })

			if (error) {
				console.error(`Error syncing game ${game.espn_id}:`, error)
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
		const supabase = await createClient()

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
