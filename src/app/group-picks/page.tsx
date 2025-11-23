"use client"

// src/app/group-picks/page.tsx
// Redirect to current week

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GroupPicksRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		const fetchCurrentWeek = async () => {
			try {
				const response = await fetch('/api/season')
				const data = await response.json()
				if (data.success && data.data?.currentWeek) {
					router.replace(`/group-picks/${data.data.currentWeek}`)
				} else {
					router.replace('/group-picks/current-week')
				}
			} catch (error) {
				console.error("Error fetching current week:", error)
				router.replace('/group-picks/current-week')
			}
		}
		fetchCurrentWeek()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-4 text-gray-600">Loading...</p>
			</div>
		</div>
	)
}
