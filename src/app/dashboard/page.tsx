"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
	const { user, loading, signOut } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) {
			router.push("/signin")
		}
	}, [user, loading, router])

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (!user) {
		return null // Will redirect
	}

	const handleSignOut = async () => {
		await signOut()
		router.push("/")
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
						<div className="flex items-center space-x-4">
							<span className="text-gray-700">Welcome, {user.email}</span>
							<button
								onClick={handleSignOut}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">
								Welcome to Pick'em!
							</h2>
							<p className="text-gray-600 mb-6">
								You're successfully signed in. This is where you'll make your
								NFL picks and view standings.
							</p>
							<div className="space-y-2 text-sm text-gray-500">
								<p>• Make weekly NFL picks with confidence points</p>
								<p>• View live standings and leaderboards</p>
								<p>• Track your performance and earnings</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
