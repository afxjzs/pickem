"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function MobileBottomNav() {
	const pathname = usePathname()
	const { user, loading } = useAuth()

	// Don't show if not authenticated or loading
	if (!user || loading) {
		return null
	}

	const isActive = (path: string) => {
		if (path === "/picks" || path === "/picks/current") {
			return pathname === "/picks" || pathname.startsWith("/picks/")
		}
		if (path === "/leaderboard/standings") {
			return pathname === "/leaderboard/standings"
		}
		if (path === "/leaderboard/weeks") {
			return pathname === "/leaderboard/weeks"
		}
		if (path === "/group-picks/current-week") {
			// Check if we're on any group-picks route (including /group-picks/current-week or /group-picks/{week})
			return pathname === "/group-picks" || pathname.startsWith("/group-picks/")
		}
		return pathname === path
	}

	const navItems = [
		{
			href: "/picks/current",
			label: "My Picks",
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			),
		},
		{
			href: "/leaderboard/standings",
			label: "Standings",
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
				</svg>
			),
		},
		{
			href: "/group-picks/current-week",
			label: "Group",
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			),
		},
		{
			href: "/leaderboard/weeks",
			label: "Weeks",
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
				</svg>
			),
		},
	]

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
			<div className="flex items-center justify-around h-16">
				{navItems.map((item) => {
					const active = isActive(item.href)
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
								active
									? "text-[#4580BC]"
									: "text-gray-500"
							}`}
						>
							<div className={`mb-1 ${active ? "text-[#4580BC]" : "text-gray-500"}`}>
								{item.icon}
							</div>
							<span className={`text-xs font-medium ${active ? "text-[#4580BC]" : "text-gray-500"}`}>
								{item.label}
							</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}

