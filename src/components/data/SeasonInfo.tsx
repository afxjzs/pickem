"use client"

import { useState, useEffect } from "react"

interface SeasonInfo {
	season: number
	currentWeek: number
}

export default function SeasonInfo() {
	const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchSeasonInfo()
	}, [])

	const fetchSeasonInfo = async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch("/api/season")
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Failed to fetch season info")
			}

			setSeasonInfo(data.data)
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-4">
				<div className="flex justify-center items-center py-4">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
					<span className="ml-2 text-gray-600">Loading season info...</span>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-4">
				<div className="bg-red-50 border border-red-200 rounded-md p-3">
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
								Error loading season info
							</h3>
							<div className="mt-1 text-sm text-red-700">{error}</div>
							<button
								onClick={fetchSeasonInfo}
								className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
							>
								Try again
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!seasonInfo) {
		return null
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border p-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium text-gray-900">Current Season</h3>
					<p className="text-sm text-gray-500">
						NFL {seasonInfo.season} Season
					</p>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-blue-600">
						Week {seasonInfo.currentWeek}
					</div>
					<div className="text-xs text-gray-500">Current Week</div>
				</div>
			</div>

			<div className="mt-4 pt-4 border-t border-gray-200">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-gray-500">Season:</span>
						<span className="ml-2 font-medium text-gray-900">
							{seasonInfo.season}
						</span>
					</div>
					<div>
						<span className="text-gray-500">Current Week:</span>
						<span className="ml-2 font-medium text-gray-900">
							{seasonInfo.currentWeek}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
