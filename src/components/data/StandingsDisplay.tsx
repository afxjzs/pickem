"use client"

import { useState, useEffect } from "react"
import { Standing } from "@/lib/types/database"

interface StandingsDisplayProps {
	initialSeason?: number
	initialConference?: "AFC" | "NFC"
}

interface GroupedStandings {
	[key: string]: Standing[]
}

export default function StandingsDisplay({
	initialSeason = 2025,
	initialConference,
}: StandingsDisplayProps) {
	const [standings, setStandings] = useState<GroupedStandings>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [season, setSeason] = useState(initialSeason)
	const [conference, setConference] = useState<"AFC" | "NFC" | "">(
		initialConference || ""
	)

	useEffect(() => {
		fetchStandings()
	}, [season, conference])

	const fetchStandings = async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			params.append("season", season.toString())
			if (conference) params.append("conference", conference)

			const response = await fetch(`/api/standings?${params.toString()}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Failed to fetch standings")
			}

			setStandings(data.data || {})
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	const getConferenceColor = (conf: string) => {
		return conf === "AFC" ? "text-blue-600" : "text-red-600"
	}

	const getConferenceBgColor = (conf: string) => {
		return conf === "AFC" ? "bg-blue-50" : "bg-red-50"
	}

	const getRankColor = (rank: number) => {
		if (rank <= 7) return "text-green-600" // Playoff spots
		if (rank <= 10) return "text-yellow-600" // In the hunt
		return "text-gray-600" // Out of contention
	}

	const getRankIcon = (rank: number) => {
		if (rank <= 7) {
			return (
				<svg
					className="w-4 h-4 text-green-600"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fillRule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clipRule="evenodd"
					/>
				</svg>
			)
		}
		return null
	}

	const calculateWinPercentage = (
		wins: number,
		losses: number,
		ties: number
	) => {
		const totalGames = wins + losses + ties
		if (totalGames === 0) return 0
		return ((wins + ties * 0.5) / totalGames).toFixed(3)
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Loading standings...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-md p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg
							className="h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Error loading standings
						</h3>
						<div className="mt-2 text-sm text-red-700">{error}</div>
						<button
							onClick={fetchStandings}
							className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		)
	}

	const conferences = Object.keys(standings)
	const totalTeams = Object.values(standings).reduce(
		(sum, conf) => sum + conf.length,
		0
	)

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="bg-white p-6 rounded-lg shadow-sm border">
				<div className="flex flex-wrap gap-6 items-end">
					<div className="mb-2 px-2">
						<label
							htmlFor="season"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Season
						</label>
						<select
							id="season"
							value={season}
							onChange={(e) => setSeason(parseInt(e.target.value))}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900"
						>
							<option value={2025}>2025</option>
							<option value={2024}>2024</option>
							<option value={2023}>2023</option>
							<option value={2022}>2022</option>
						</select>
					</div>

					<div className="mb-2 px-2">
						<label
							htmlFor="conference"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Conference
						</label>
						<select
							id="conference"
							value={conference}
							onChange={(e) =>
								setConference(e.target.value as "AFC" | "NFC" | "")
							}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900"
						>
							<option value="">All Conferences</option>
							<option value="AFC">AFC</option>
							<option value="NFC">NFC</option>
						</select>
					</div>

					<div className="ml-auto">
						<span className="text-sm text-gray-500">
							{totalTeams} team{totalTeams !== 1 ? "s" : ""}
						</span>
					</div>
				</div>
			</div>

			{/* Standings Tables */}
			<div className="space-y-6">
				{conferences.map((conf) => (
					<div
						key={conf}
						className="bg-white rounded-lg shadow-sm border overflow-hidden"
					>
						<div className={`px-4 py-3 ${getConferenceBgColor(conf)} border-b`}>
							<h3
								className={`text-lg font-semibold ${getConferenceColor(conf)}`}
							>
								{conf} Conference
							</h3>
						</div>

						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Rank
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Team
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											W
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											L
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											T
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											PCT
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											PF
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											PA
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{standings[conf].map((standing, index) => (
										<tr
											key={`${standing.conference}-${standing.team_id}-${index}`}
											className="hover:bg-gray-50"
										>
											<td className="px-4 py-3 whitespace-nowrap">
												<div className="flex items-center">
													<span
														className={`text-sm font-medium ${getRankColor(
															standing.rank
														)}`}
													>
														{standing.rank}
													</span>
													{getRankIcon(standing.rank) && (
														<span className="ml-1">
															{getRankIcon(standing.rank)}
														</span>
													)}
												</div>
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<div className="flex items-center space-x-3">
													{/* Team Logo and Color Swatch */}
													<div className="flex items-center space-x-2">
														{/* Team Logo */}
														{(standing as any).team_logo ? (
															<img
																src={(standing as any).team_logo}
																alt={`${(standing as any).team_name} logo`}
																className="w-8 h-8 rounded-full"
															/>
														) : null}

														{/* Color Swatch */}
														<div
															className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border border-gray-300"
															style={{
																backgroundColor: `#${
																	(standing as any).team_primary_color ||
																	"666666"
																}`,
															}}
														>
															{(standing as any).team_abbreviation?.slice(
																0,
																2
															) ||
																standing.team_id?.slice(0, 2) ||
																"TM"}
														</div>
													</div>

													{/* Team Info */}
													<div>
														<div className="text-sm font-medium text-gray-900">
															{(standing as any).team_name ||
																`Team ${standing.team_id}`}
														</div>
														<div className="text-xs text-gray-500">
															{(standing as any).team_division || ""} Division
														</div>
													</div>
												</div>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{standing.wins}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{standing.losses}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{standing.ties}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{calculateWinPercentage(
														standing.wins,
														standing.losses,
														standing.ties
													)}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{standing.points_for}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-center">
												<span className="text-sm text-gray-900">
													{standing.points_against}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{conferences.length === 0 && !loading && (
				<div className="text-center py-12">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No standings found
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Try adjusting your filters or check back later.
					</p>
				</div>
			)}
		</div>
	)
}
