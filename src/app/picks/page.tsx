"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { Game, Team, Pick } from "@/lib/types/database"
import Navigation from "@/components/layout/Navigation"

interface GameWithTeams extends Game {
	home_team_data: Team | null
	away_team_data: Team | null
}

interface UserPick {
	gameId: string
	pickedTeam: string
	confidencePoints: number
	saving?: boolean
	saved?: boolean
}

function PicksPageContent() {
	const { user } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [games, setGames] = useState<GameWithTeams[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [userPicks, setUserPicks] = useState<UserPick[]>([])
	const [season, setSeason] = useState("2025")
	const [week, setWeek] = useState(12) // Default to week 12 for testing
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
	const [currentWeek, setCurrentWeek] = useState<number | null>(null)
	const [debugInfo, setDebugInfo] = useState<any>(null)

	// Available confidence points (1-16)
	const confidencePoints = Array.from({ length: 16 }, (_, i) => i + 1)

	// Initialize week from URL or fetch current week
	useEffect(() => {
		const weekParam = searchParams.get("week")
		if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				setWeek(weekNum)
			}
		} else {
			// Fetch current week if not in URL
			const fetchCurrentWeek = async () => {
				try {
					const response = await fetch("/api/season")
					const data = await response.json()
					if (data.success && data.data.currentWeek) {
						const weekNum = data.data.currentWeek
						setCurrentWeek(weekNum)
						setWeek(weekNum)
						// Update URL to include week
						router.replace(`/picks?week=${weekNum}`, { scroll: false })
					} else {
						// Default to week 12 for testing
						setWeek(12)
						router.replace(`/picks?week=12`, { scroll: false })
					}
				} catch (error) {
					console.error("Error fetching current week:", error)
					// Default to week 12 for testing
					setWeek(12)
					router.replace(`/picks?week=12`, { scroll: false })
				}
			}
			fetchCurrentWeek()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // Only run once on mount

	// Update URL when week changes via dropdown (not from URL)
	const handleWeekChange = (newWeek: number) => {
		setWeek(newWeek)
		router.push(`/picks?week=${newWeek}`, { scroll: false })
	}

	useEffect(() => {
		if (user) {
			// Fetch games first, then picks (picks need games to match against)
			fetchGames()
			fetchTeams()
		}
	}, [user, season, week])

	// Fetch picks after games are loaded
	useEffect(() => {
		if (user && games.length > 0) {
			fetchUserPicks()
		}
	}, [user, season, week, games.length])

	const fetchGames = async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/games?season=${season}&week=${week}`)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			const data = await response.json()
			if (data.success && Array.isArray(data.data)) {
				// Games from the database should have UUIDs
				// Filter out any games without an id (shouldn't happen, but be safe)
				const validGames = data.data
					.filter((game: GameWithTeams) => {
						// Games must have an id (UUID from database)
						return game.id && game.id !== null && game.id !== undefined && game.id !== ""
					})
					.map((game: GameWithTeams) => {
						// Ensure id is a string for consistent comparison
						return { ...game, id: String(game.id) }
					})
				
				setGames(validGames)
			} else {
				console.warn("Games API returned unsuccessful response:", data)
				setGames([])
			}
		} catch (error) {
			console.error("Error fetching games:", error)
			setGames([])
		} finally {
			setLoading(false)
		}
	}

	const fetchTeams = async () => {
		try {
			const response = await fetch("/api/teams")
			const data = await response.json()
			if (data.success) {
				setTeams(data.data)
			}
		} catch (error) {
			console.error("Error fetching teams:", error)
		}
	}

	const fetchUserPicks = async () => {
		try {
			const response = await fetch(`/api/picks?season=${season}&week=${week}`, {
				credentials: 'include',
			})
			const data = await response.json()
			if (data.success) {
				// Convert picks to UserPick format
				// Ensure gameId is always a string for consistent comparison
				const picks: UserPick[] = data.data.map((pick: Pick) => ({
					gameId: String(pick.game_id),
					pickedTeam: pick.picked_team,
					confidencePoints: pick.confidence_points,
					saving: false,
					saved: true, // Picks from database are saved
				}))
				
				// Merge with existing picks to preserve any unsaved changes
				setUserPicks((prev) => {
					const merged = new Map<string, UserPick>()
					
					// First, add all existing picks (preserve unsaved changes)
					prev.forEach((pick) => {
						merged.set(String(pick.gameId), pick)
					})
					
					// Then, add/update picks from database (these override if they exist)
					picks.forEach((pick) => {
						merged.set(String(pick.gameId), pick)
					})
					
					return Array.from(merged.values())
				})
			}
		} catch (error) {
			console.error("Error fetching user picks:", error)
		}
	}

	const savePick = async (pick: UserPick) => {
		if (!user || !pick.pickedTeam) {
			console.warn("[savePick] Skipping save - no user or team:", { hasUser: !!user, hasTeam: !!pick.pickedTeam })
			return // Don't save incomplete picks (team is required)
		}

		console.log("[savePick] Attempting to save pick:", { gameId: pick.gameId, team: pick.pickedTeam, points: pick.confidencePoints })

		// Set saving state
		setUserPicks(prev => prev.map(p => 
			String(p.gameId).trim() === String(pick.gameId).trim() 
				? { ...p, saving: true, saved: false }
				: p
		))

		try {
			// First, test auth
			const authTest = await fetch("/api/auth-test", { credentials: 'include' })
			const authData = await authTest.json()
			console.log("[savePick] Auth test result:", authData)
			
			if (!authData.auth?.hasUser) {
				console.error("[savePick] Auth test failed - no user found")
				console.error("[savePick] Auth error:", authData.auth?.error)
				console.error("[savePick] Session:", authData.session)
				console.error("[savePick] Database check:", authData.database)
				setDebugInfo(authData)
				
				// Provide more specific error message
				let errorMsg = "Authentication failed. "
				if (authData.auth?.error?.includes("does not exist")) {
					errorMsg += "Your session may be invalid. Please sign out and sign in again."
				} else if (authData.session?.error) {
					errorMsg += "Session error: " + authData.session.error
				} else {
					errorMsg += "Please refresh the page and try again."
				}
				
				setMessage({ text: errorMsg, type: "error" })
				// Clear saving state on error
				setUserPicks(prev => prev.map(p => 
					String(p.gameId).trim() === String(pick.gameId).trim() 
						? { ...p, saving: false, saved: false }
						: p
				))
				return
			}
			
			// Check if user exists in database (warn but don't block - user might not have a users table row yet)
			if (authData.database && !authData.database.exists) {
				console.warn("[savePick] User not found in users table (but authenticated):", authData.database)
				// Don't block saving - the user is authenticated, which is what matters for picks
				// The users table row might be created later or might not be required
			}

			// Try POST first (for new picks), then PUT if it fails because pick exists
			const response = await fetch("/api/picks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
				body: JSON.stringify({
					gameId: pick.gameId,
					pickedTeam: pick.pickedTeam,
					confidencePoints: pick.confidencePoints || 0,
				}),
			})

			const data = await response.json()
			console.log("[savePick] POST response:", { success: data.success, message: data.message, status: response.status })
			
			if (!data.success) {
				// If POST fails because pick exists, try PUT
				if (data.message?.includes("already has a pick")) {
					console.log("[savePick] Pick exists, trying PUT...")
					const putResponse = await fetch("/api/picks", {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: 'include',
						body: JSON.stringify({
							gameId: pick.gameId,
							pickedTeam: pick.pickedTeam,
							confidencePoints: pick.confidencePoints || 0,
						}),
					})
					const putData = await putResponse.json()
					console.log("[savePick] PUT response:", { success: putData.success, message: putData.message, status: putResponse.status })
					if (!putData.success) {
						console.error("[savePick] Failed to update pick:", putData.message)
						setMessage({ text: `Failed to save pick: ${putData.message}`, type: "error" })
						// Clear saving state on error
						setUserPicks(prev => prev.map(p => 
							String(p.gameId).trim() === String(pick.gameId).trim() 
								? { ...p, saving: false, saved: false }
								: p
						))
					} else {
						console.log("[savePick] Pick updated successfully")
						// Set saved state (no message - checkmark will show)
						setUserPicks(prev => prev.map(p => 
							String(p.gameId).trim() === String(pick.gameId).trim() 
								? { ...p, saving: false, saved: true }
								: p
						))
					}
				} else {
					console.error("[savePick] Failed to save pick:", data.message)
					setMessage({ text: `Failed to save pick: ${data.message}`, type: "error" })
					// Clear saving state on error
					setUserPicks(prev => prev.map(p => 
						String(p.gameId).trim() === String(pick.gameId).trim() 
							? { ...p, saving: false, saved: false }
							: p
					))
				}
			} else {
				console.log("[savePick] Pick saved successfully")
				// Set saved state (no message - checkmark will show)
				setUserPicks(prev => prev.map(p => 
					String(p.gameId).trim() === String(pick.gameId).trim() 
						? { ...p, saving: false, saved: true }
						: p
				))
			}
		} catch (error) {
			console.error("[savePick] Error saving pick:", error)
			setMessage({ text: `Error saving pick: ${error instanceof Error ? error.message : String(error)}`, type: "error" })
			// Clear saving state on error
			setUserPicks(prev => prev.map(p => 
				String(p.gameId).trim() === String(pick.gameId).trim() 
					? { ...p, saving: false, saved: false }
					: p
			))
		}
	}

	const handlePickChange = (gameId: string, pickedTeam: string) => {
		if (!gameId || gameId === "undefined" || gameId === "null") {
			console.error("Invalid gameId:", gameId)
			return
		}
		
		setUserPicks((prev) => {
			// Normalize the gameId for comparison
			const normalizedGameId = String(gameId).trim()
			
			// Create a new array to avoid mutation issues
			// Use strict comparison with normalized IDs
			const existingIndex = prev.findIndex((p) => {
				const pickGameId = String(p.gameId).trim()
				return pickGameId === normalizedGameId && pickGameId !== "" && normalizedGameId !== ""
			})
			
			let updated: UserPick[]
			if (existingIndex >= 0) {
				// Update existing pick for this game ONLY - create completely new object
				updated = prev.map((pick, index) => {
					if (index === existingIndex) {
						return {
							...pick,
							pickedTeam, // Only update the pickedTeam for this specific game
							saved: false, // Reset saved state when pick changes
						}
					}
					return pick // Return unchanged pick for all other games
				})
			} else {
				// Add new pick for this game
				updated = [...prev, { gameId: normalizedGameId, pickedTeam, confidencePoints: 0, saving: false, saved: false }]
			}
			
			// Auto-save if pick has a team selected (even if confidence points not set yet)
			const updatedPick = updated.find((p) => String(p.gameId).trim() === normalizedGameId)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}
			
			return updated
		})
	}

	const handleConfidenceChange = (gameId: string, confidencePoints: number) => {
		if (!gameId || gameId === "undefined" || gameId === "null") {
			console.error("Invalid gameId:", gameId)
			return
		}

		setUserPicks((prev) => {
			// Normalize the gameId for comparison
			const normalizedGameId = String(gameId).trim()
			
			// Find if this confidence point is already used by another game
			const pointUsedBy = prev.find(
				(p) => p.confidencePoints === confidencePoints && String(p.gameId).trim() !== normalizedGameId
			)
			
			// Create a new array to avoid mutation issues
			// Ensure we're comparing the same type (both strings)
			const existingIndex = prev.findIndex((p) => {
				const pickGameId = String(p.gameId).trim()
				return pickGameId === normalizedGameId && pickGameId !== "" && normalizedGameId !== ""
			})
			
			let updated: UserPick[]
			if (existingIndex >= 0) {
				// Update existing pick for this game ONLY
				updated = prev.map((pick, index) => {
					if (index === existingIndex) {
						return {
							...pick,
							confidencePoints,
							saved: false, // Reset saved state when confidence changes
						}
					}
					// If this point was used by another game, clear it from that game
					if (pointUsedBy && String(pick.gameId).trim() === String(pointUsedBy.gameId).trim()) {
						return {
							...pick,
							confidencePoints: 0,
							saved: false, // Reset saved state when confidence changes
						}
					}
					return pick
				})
			} else {
				// Add new pick for this game (but keep existing pickedTeam if any)
				const existingPick = prev.find((p) => String(p.gameId).trim() === normalizedGameId)
				updated = [
					...prev.map((pick) => {
						// If this point was used by another game, clear it from that game
						if (pointUsedBy && String(pick.gameId).trim() === String(pointUsedBy.gameId).trim()) {
							return {
								...pick,
								confidencePoints: 0,
								saved: false, // Reset saved state when confidence changes
							}
						}
						return pick
					}),
					{
						gameId: normalizedGameId,
						saving: false,
						saved: false,
						pickedTeam: existingPick?.pickedTeam || "",
						confidencePoints,
					},
				]
			}
			
			// Auto-save when confidence points are set (if team is already selected)
			const updatedPick = updated.find((p) => String(p.gameId).trim() === normalizedGameId)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}
			
			// Also save the pick that lost its confidence points (if it had a team)
			if (pointUsedBy && pointUsedBy.pickedTeam) {
				const clearedPick = updated.find((p) => String(p.gameId).trim() === String(pointUsedBy.gameId).trim())
				if (clearedPick && clearedPick.pickedTeam) {
					// Update the pick in database to remove confidence points
					savePick(clearedPick)
				}
			}
			
			return updated
		})
	}

	const getUsedConfidencePoints = () => {
		return userPicks
			.filter((pick) => pick.confidencePoints > 0)
			.map((pick) => pick.confidencePoints)
	}

	const getAvailableConfidencePoints = () => {
		const used = getUsedConfidencePoints()
		return confidencePoints.filter((point) => !used.includes(point))
	}

	const isGameLocked = (game: Game) => {
		const gameTime = new Date(game.start_time)
		const now = new Date()
		// Games are locked 5 minutes before start time
		const lockTime = new Date(gameTime.getTime() - 5 * 60 * 1000)
		return now >= lockTime
	}

	const submitPicks = async () => {
		if (!user) return

		// Validate picks
		const validPicks = userPicks.filter(
			(pick) => pick.pickedTeam && pick.confidencePoints > 0
		)

		if (validPicks.length === 0) {
			setMessage({ text: "Please make at least one pick", type: "error" })
			return
		}

		// Check for duplicate confidence points
		const usedPoints = getUsedConfidencePoints()
		if (new Set(usedPoints).size !== usedPoints.length) {
			setMessage({ text: "Each confidence point can only be used once per week", type: "error" })
			return
		}

		setSubmitting(true)
		setMessage(null)

		try {
			// Since picks are auto-saved, just refresh to show confirmation
			// Don't clear the state - just refresh picks from database to ensure sync
			const currentPicks = [...userPicks] // Save current state
			await fetchUserPicks()
			
			// Merge any new picks from database with current state
			// This ensures we don't lose any unsaved changes
			setUserPicks((prev) => {
				const merged = new Map<string, UserPick>()
				
				// First, add all picks from database (these are saved)
				prev.forEach((pick) => {
					merged.set(String(pick.gameId), pick)
				})
				
				// Then, add any current picks that aren't in database yet
				currentPicks.forEach((pick) => {
					if (pick.pickedTeam && pick.confidencePoints > 0) {
						merged.set(String(pick.gameId), pick)
					}
				})
				
				return Array.from(merged.values())
			})
			
			setMessage({ text: "All picks saved successfully!", type: "success" })
			setTimeout(() => setMessage(null), 3000)
		} catch (error) {
			setMessage({
				text: error instanceof Error ? error.message : "Failed to verify picks",
				type: "error"
			})
		} finally {
			setSubmitting(false)
		}
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">
							Make Your Picks
						</h1>
						<p className="text-gray-600">Please sign in to make your picks.</p>
					</div>
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading games...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Make Your Picks
					</h1>
					<p className="text-gray-600 mb-6">
						Pick the winner of each game and assign confidence points (1-16).
						Each confidence point can only be used once per week.
					</p>

					{/* Controls */}
					<div className="flex flex-wrap gap-4 items-center mb-6">
						<div>
							<label
								htmlFor="season"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Season
							</label>
							<select
								id="season"
								value={season}
								onChange={(e) => setSeason(e.target.value)}
								className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="2025">2025</option>
							</select>
						</div>

						<div>
							<label
								htmlFor="week"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Week
							</label>
							<select
								id="week"
								value={week}
								onChange={(e) => handleWeekChange(parseInt(e.target.value))}
								className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
									<option key={w} value={w}>
										Week {w}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Message */}
					{message && (
						<div
							className={`p-4 rounded-md mb-6 ${
								message.type === "success"
									? "bg-green-50 text-green-800 border border-green-200"
									: message.type === "error"
									? "bg-red-50 text-red-800 border border-red-200"
									: "bg-blue-50 text-blue-800 border border-blue-200"
							}`}
						>
							{message.text}
						</div>
					)}

					{/* Debug Panel - Only show if there's debug info */}
					{debugInfo && (
						<div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-md">
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-bold text-yellow-900 text-lg">🔍 Debug Info</h3>
								<button
									onClick={() => setDebugInfo(null)}
									className="text-sm text-yellow-700 hover:text-yellow-900 underline font-semibold"
								>
									✕ Clear
								</button>
							</div>
							<div className="bg-white p-4 rounded border-2 border-yellow-300">
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">Authentication Status:</h4>
									<div className={`p-3 rounded ${debugInfo.auth?.hasUser ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
										<strong>User Found:</strong> {debugInfo.auth?.hasUser ? '✅ Yes' : '❌ No'}<br/>
										{debugInfo.auth?.userId && <><strong>User ID:</strong> {debugInfo.auth.userId}<br/></>}
										{debugInfo.auth?.error && <><strong>Error:</strong> {debugInfo.auth.error}</>}
									</div>
								</div>
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">Cookies Found ({debugInfo.cookies?.length || 0}):</h4>
									<div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
										{debugInfo.cookies?.map((cookie: any, idx: number) => (
											<div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
												<strong className="text-gray-800">{cookie.name}</strong><br/>
												<span className="text-sm text-gray-600">
													Has Value: {cookie.hasValue ? '✅' : '❌'} | 
													Length: {cookie.valueLength || 0}
												</span>
											</div>
										))}
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 mb-2">Full JSON:</h4>
									<pre className="text-xs overflow-auto max-h-64 bg-gray-50 p-3 rounded border font-mono text-gray-900 font-medium">
										{JSON.stringify(debugInfo, null, 2)}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Games */}
				<div className="space-y-6">
					{games.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500">No games found for Week {week}</p>
						</div>
					) : (
						games.map((game) => {
								// Find the pick for THIS specific game by matching gameId
								// Use strict comparison with normalized IDs
								const gameIdStr = String(game.id).trim()
								const userPick = userPicks.find((p) => {
									const pickGameIdStr = String(p.gameId).trim()
									return pickGameIdStr === gameIdStr && pickGameIdStr !== "" && gameIdStr !== ""
								})
								const isLocked = isGameLocked(game)
							const homeTeam = teams.find(
								(t) => t.abbreviation === game.home_team
							)
							const awayTeam = teams.find(
								(t) => t.abbreviation === game.away_team
							)

							return (
								<div
									key={`game-${game.id || `index-${games.indexOf(game)}`}`}
									className={`bg-white rounded-lg shadow p-6 relative ${
										isLocked ? "opacity-60" : ""
									}`}
								>
									{/* Save Status Indicator - Upper Right */}
									<div className="absolute top-4 right-4">
										{userPick?.saving && (
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
										)}
										{userPick?.saved && !userPick?.saving && (
											<div className="text-green-600">
												<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
												</svg>
											</div>
										)}
									</div>

									{/* Game Header */}
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-3">
											<span className="text-sm font-medium text-gray-500">
												Week {game.week} •{" "}
												{new Date(game.start_time).toLocaleDateString()}
											</span>
											{game.is_snf && (
												<span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
													SNF
												</span>
											)}
											{game.is_mnf && (
												<span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
													MNF
												</span>
											)}
										</div>
										{isLocked && (
											<span className="text-red-600 text-sm font-medium">
												🔒 LOCKED
											</span>
										)}
									</div>

									{/* Teams - Button-based Selection */}
									{!isLocked ? (
										<div className="mb-4">
											<label className="block text-sm font-medium text-gray-700 mb-3">
												Pick Winner
											</label>
											<div className="flex items-center gap-4">
												{/* Away Team Button */}
												<button
													type="button"
													onClick={() => handlePickChange(game.id, game.away_team)}
													className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all flex-1 ${
														userPick?.pickedTeam === game.away_team
															? "border-blue-500 bg-blue-50 shadow-md"
															: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
													}`}
												>
													{awayTeam?.logo_url && (
														<img
															src={awayTeam.logo_url}
															alt={awayTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{awayTeam?.name || game.away_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.away_team}
														</div>
													</div>
													{userPick?.pickedTeam === game.away_team && (
														<div className="text-blue-600">
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
															</svg>
														</div>
													)}
												</button>

												{/* @ Symbol */}
												<div className="text-gray-400 font-bold text-xl">@</div>

												{/* Home Team Button */}
												<button
													type="button"
													onClick={() => handlePickChange(game.id, game.home_team)}
													className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all flex-1 ${
														userPick?.pickedTeam === game.home_team
															? "border-blue-500 bg-blue-50 shadow-md"
															: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
													}`}
												>
													{homeTeam?.logo_url && (
														<img
															src={homeTeam.logo_url}
															alt={homeTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{homeTeam?.name || game.home_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.home_team}
														</div>
													</div>
													{userPick?.pickedTeam === game.home_team && (
														<div className="text-blue-600">
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
															</svg>
														</div>
													)}
												</button>
											</div>

											{/* Game Time */}
											<div className="text-center mt-2 text-sm text-gray-500">
												{new Date(game.start_time).toLocaleDateString([], {
													weekday: "short",
													month: "short",
													day: "numeric",
												})}{" "}
												{new Date(game.start_time).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
										</div>
									) : (
										/* Locked Game Display */
										<div className="grid grid-cols-2 gap-4 mb-4">
											<div key={`locked-away-${game.id}`} className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60">
												{awayTeam?.logo_url && (
													<img
														src={awayTeam.logo_url}
														alt={awayTeam.name}
														className="w-12 h-12 flex-shrink-0"
													/>
												)}
												<div>
													<div className="font-semibold text-gray-900">
														{awayTeam?.name || game.away_team}
													</div>
													<div className="text-sm text-gray-500">
														{game.away_team}
													</div>
												</div>
											</div>
											<div key={`locked-home-${game.id}`} className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60">
												{homeTeam?.logo_url && (
													<img
														src={homeTeam.logo_url}
														alt={homeTeam.name}
														className="w-12 h-12 flex-shrink-0"
													/>
												)}
												<div>
													<div className="font-semibold text-gray-900">
														{homeTeam?.name || game.home_team}
													</div>
													<div className="text-sm text-gray-500">
														{game.home_team}
													</div>
												</div>
											</div>
										</div>
									)}

									{/* Confidence Points - Button Row */}
									{!isLocked && (
										<div className="mb-4">
											<label className="block text-sm font-medium text-gray-700 mb-2 text-center">
												Confidence Points
											</label>
											<div className="flex flex-wrap gap-2 justify-center">
												{Array.from({ length: games.length }, (_, i) => i + 1).map((point) => {
													const isUsed = getUsedConfidencePoints().includes(point)
													const isCurrent = userPick?.confidencePoints === point
													const usedByGame = userPicks.find((p) => p.confidencePoints === point && String(p.gameId).trim() !== String(game.id).trim())
													
													return (
														<button
															key={point}
															type="button"
															onClick={() => handleConfidenceChange(game.id, point)}
															className={`px-4 py-2 rounded-md font-medium transition-all ${
																isCurrent
																	? "bg-blue-600 text-white shadow-md border-2 border-blue-600"
																	: isUsed
																	? "bg-gray-200 text-gray-500 hover:bg-gray-300 border-2 border-gray-200"
																	: "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
															}`}
															title={usedByGame ? `Currently used by another game` : ""}
														>
															{point}
														</button>
													)
												})}
											</div>
										</div>
									)}
								</div>
							)
						})
					)}
				</div>

				{/* Submit Button */}
				{games.length > 0 && (
					<div className="mt-8 text-center">
						<button
							onClick={submitPicks}
							disabled={submitting || games.length === 0}
							className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? "Submitting..." : "Submit Picks"}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default function PicksPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 py-8">
				<Navigation />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading picks...</p>
					</div>
				</div>
			</div>
		}>
			<PicksPageContent />
		</Suspense>
	)
}
