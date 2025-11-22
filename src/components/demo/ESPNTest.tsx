"use client"

import { useState, useEffect } from "react"
import { espnAPI, ESPNTeam, ESPNGame, ESPNStanding } from "@/lib/api/espn"

export default function ESPNTest() {
	const [teams, setTeams] = useState<ESPNTeam[]>([])
	const [schedule, setSchedule] = useState<ESPNGame[]>([])
	const [standings, setStandings] = useState<{
		afc: ESPNStanding[]
		nfc: ESPNStanding[]
	}>({ afc: [], nfc: [] })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const testAPIs = async () => {
		setLoading(true)
		setError(null)

		try {
			// Test all three API endpoints
			const [teamsData, scheduleData, standingsData] = await Promise.all([
				espnAPI.getTeams(),
				espnAPI.getSchedule(2024, 1),
				espnAPI.getAllStandings(2024),
			])

			setTeams(teamsData)
			setSchedule(scheduleData)
			setStandings(standingsData)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		testAPIs()
	}, [])

	if (loading) {
		return <div className="p-4">Loading ESPN API data...</div>
	}

	if (error) {
		return (
			<div className="p-4">
				<div className="text-red-600 mb-4">Error: {error}</div>
				<button
					onClick={testAPIs}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Retry
				</button>
			</div>
		)
	}

	return (
		<div className="p-4 space-y-6">
			<h2 className="text-2xl font-bold">ESPN API Test Results</h2>

			{/* Teams Section */}
			<div>
				<h3 className="text-xl font-semibold mb-3">Teams ({teams.length})</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{teams.slice(0, 8).map((team) => (
						<div key={team.id} className="border rounded p-3 text-center">
							<div className="font-semibold">{team.abbreviation}</div>
							<div className="text-sm text-gray-600">{team.name}</div>
						</div>
					))}
					{teams.length > 8 && (
						<div className="border rounded p-3 text-center text-gray-500">
							+{teams.length - 8} more
						</div>
					)}
				</div>
			</div>

			{/* Schedule Section */}
			<div>
				<h3 className="text-xl font-semibold mb-3">
					Week 1 Schedule ({schedule.length} games)
				</h3>
				<div className="space-y-2">
					{schedule.slice(0, 5).map((game) => (
						<div key={game.id} className="border rounded p-3">
							<div className="font-semibold">{game.shortName}</div>
							<div className="text-sm text-gray-600">
								{new Date(game.date).toLocaleDateString()} -{" "}
								{game.competitions[0]?.venue?.fullName}
							</div>
						</div>
					))}
					{schedule.length > 5 && (
						<div className="text-center text-gray-500">
							+{schedule.length - 5} more games
						</div>
					)}
				</div>
			</div>

			{/* Standings Section */}
			<div>
				<h3 className="text-xl font-semibold mb-3">Standings</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-semibold mb-2">
							AFC ({standings.afc.length} teams)
						</h4>
						<div className="space-y-1">
							{standings.afc.slice(0, 5).map((standing) => {
								const overallRecord = standing.records.find(
									(r) => r.name === "overall"
								)
								return (
									<div
										key={standing.team.id}
										className="flex justify-between text-sm"
									>
										<span>{standing.team.abbreviation}</span>
										<span>{overallRecord?.summary || "N/A"}</span>
									</div>
								)
							})}
						</div>
					</div>
					<div>
						<h4 className="font-semibold mb-2">
							NFC ({standings.nfc.length} teams)
						</h4>
						<div className="space-y-1">
							{standings.nfc.slice(0, 5).map((standing) => {
								const overallRecord = standing.records.find(
									(r) => r.name === "overall"
								)
								return (
									<div
										key={standing.team.id}
										className="flex justify-between text-sm"
									>
										<span>{standing.team.abbreviation}</span>
										<span>{overallRecord?.summary || "N/A"}</span>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Refresh Button */}
			<div className="text-center">
				<button
					onClick={testAPIs}
					className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					Refresh Data
				</button>
			</div>
		</div>
	)
}

