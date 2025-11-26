"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PicksRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace("/picks/current")
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
