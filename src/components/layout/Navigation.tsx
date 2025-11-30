"use client"

import { memo, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

function Navigation() {
	const { user, loading, signOut } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	// Debug logging in dev mode
	if (process.env.NODE_ENV === "development") {
		console.log("[Navigation] Render:", {
			hasUser: !!user,
			userId: user?.id,
			userEmail: user?.email,
			loading,
			pathname,
		})
	}

	const handleSignOut = async () => {
		try {
			console.log("[Navigation] Sign out button clicked")
			const { error } = await signOut()
			if (error) {
				console.error("[Navigation] Sign out error:", error)
				// Still redirect even if there's an error
			}
			// Redirect to home page after sign out
			router.push("/")
			// Force a page reload to ensure all state is cleared
			router.refresh()
		} catch (error) {
			console.error("[Navigation] Unexpected error during sign out:", error)
			// Still redirect even if there's an error
			router.push("/")
		}
	}

	const isActive = (path: string) => {
		if (path === "/leaderboard") {
			return pathname === "/leaderboard"
		}
		if (path === "/leaderboard/weeks") {
			return pathname === "/leaderboard/weeks"
		}
		if (path === "/leaderboard/standings") {
			return pathname === "/leaderboard/standings"
		}
		if (path === "/group-picks") {
			return pathname === "/group-picks" || pathname.startsWith("/group-picks")
		}
		if (path === "/picks") {
			return pathname === "/picks" || pathname.startsWith("/picks")
		}
		return pathname === path
	}

	// Close mobile menu when route changes
	useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	// Prevent body scroll when mobile menu is open
	useEffect(() => {
		if (isMobileMenuOpen) {
			document.body.classList.add("overflow-hidden")
		} else {
			document.body.classList.remove("overflow-hidden")
		}
		return () => {
			document.body.classList.remove("overflow-hidden")
		}
	}, [isMobileMenuOpen])

	// Always render the navigation structure to prevent layout shift
	// Only show content when user is authenticated
	if (!user && !loading) {
		// Not authenticated and not loading - show minimal nav or nothing
		return null
	}

	return (
		<header className="bg-white shadow relative z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-4 md:py-6">
					<div className="flex items-center space-x-4 md:space-x-8">
						<Link href="/" className="flex items-center">
							<Image
								src="/assets/pickmonster-word-logo.svg"
								alt="PickMonster"
								width={140}
								height={32}
								className="h-6 md:h-8 w-auto"
							/>
						</Link>
						{/* Desktop Navigation - Hidden on mobile */}
						{loading ? (
							// Show loading state for nav items
							<nav className="hidden md:flex items-center space-x-4">
								<div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 animate-pulse">
									Loading...
								</div>
							</nav>
						) : user ? (
							// Show full nav when authenticated
							<nav className="hidden md:flex items-center space-x-4">
								<Link
									href="/dashboard"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/dashboard")
											? "bg-[#4580BC]/10 text-[#4580BC]"
											: "text-gray-600 hover:text-[#4580BC] hover:bg-[#4580BC]/5"
									}`}
								>
									Dashboard
								</Link>
								<Link
									href="/picks/current"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/picks")
											? "bg-[#4580BC]/10 text-[#4580BC]"
											: "text-gray-600 hover:text-[#4580BC] hover:bg-[#4580BC]/5"
									}`}
								>
									My Picks
								</Link>
								<Link
									href="/leaderboard/weeks"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/leaderboard/weeks")
											? "bg-[#4580BC]/10 text-[#4580BC]"
											: "text-gray-600 hover:text-[#4580BC] hover:bg-[#4580BC]/5"
									}`}
								>
									Weeks
								</Link>
								<Link
									href="/leaderboard/standings"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/leaderboard/standings")
											? "bg-[#4580BC]/10 text-[#4580BC]"
											: "text-gray-600 hover:text-[#4580BC] hover:bg-[#4580BC]/5"
									}`}
								>
									Standings
								</Link>
								<Link
									href="/group-picks/current-week"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/group-picks")
											? "bg-[#4580BC]/10 text-[#4580BC]"
											: "text-gray-600 hover:text-[#4580BC] hover:bg-[#4580BC]/5"
									}`}
								>
									Group Picks
								</Link>
							</nav>
						) : (
							// Not authenticated - show minimal nav or nothing
							<nav className="hidden md:flex items-center space-x-4">
								<Link
									href="/"
									className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
								>
									Home
								</Link>
							</nav>
						)}
					</div>
					<div className="flex items-center space-x-2 md:space-x-4">
						{/* Mobile Menu Button */}
						{user && !loading && (
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Toggle menu"
							>
								{isMobileMenuOpen ? (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								) : (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								)}
							</button>
						)}
						{/* Desktop User Actions */}
						{loading ? (
							<div className="hidden md:block text-gray-400 animate-pulse">
								Loading...
							</div>
						) : user ? (
							<>
								<Link
									href="/profile"
									className="hidden md:block text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors truncate max-w-[150px]"
									title={user.email}
								>
									{user.email}
								</Link>
								<button
									onClick={handleSignOut}
									className="hidden md:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Sign Out
								</button>
							</>
						) : (
							<>
								<Link
									href="/signin"
									className="hidden md:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
								>
									Sign In
								</Link>
								<Link
									href="/signup"
									className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && user && !loading && (
				<div
					className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={() => setIsMobileMenuOpen(false)}
				>
					<div
						className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-50 overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="px-4 py-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold text-gray-900">Menu</h2>
								<button
									onClick={() => setIsMobileMenuOpen(false)}
									className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									aria-label="Close menu"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
							<nav className="space-y-2">
								<Link
									href="/dashboard"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
										isActive("/dashboard")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Dashboard
								</Link>
								<Link
									href="/picks/current"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
										isActive("/picks")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									My Picks
								</Link>
								<Link
									href="/leaderboard/weeks"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
										isActive("/leaderboard/weeks")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Weeks
								</Link>
								<Link
									href="/leaderboard/standings"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
										isActive("/leaderboard/standings")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Standings
								</Link>
								<Link
									href="/group-picks/current-week"
									onClick={() => setIsMobileMenuOpen(false)}
									className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
										isActive("/group-picks")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Group Picks
								</Link>
							</nav>
							<div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
								<Link
									href="/profile"
									onClick={() => setIsMobileMenuOpen(false)}
									className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
								>
									{user.email}
								</Link>
								<button
									onClick={() => {
										setIsMobileMenuOpen(false)
										handleSignOut()
									}}
									className="w-full text-left px-4 py-3 rounded-md text-base font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
								>
									Sign Out
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</header>
	)
}

export default memo(Navigation)
