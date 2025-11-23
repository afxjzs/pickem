"use client"

import React, { useState, useEffect, useRef } from "react"

interface ProfileStepProps {
	onNext: (data: {
		firstName: string
		lastName: string
		username: string
		avatarUrl?: string
	}) => void
	initialData?: {
		firstName?: string
		lastName?: string
		username?: string
		avatarUrl?: string
	}
}

export function ProfileStep({ onNext, initialData }: ProfileStepProps) {
	const [firstName, setFirstName] = useState(initialData?.firstName || "")
	const [lastName, setLastName] = useState(initialData?.lastName || "")
	const [username, setUsername] = useState(initialData?.username || "")
	const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || "")
	const [usernameError, setUsernameError] = useState<string | null>(null)
	const [isCheckingUsername, setIsCheckingUsername] = useState(false)
	const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Check username availability
	useEffect(() => {
		if (username.trim().length === 0) {
			setUsernameError(null)
			return
		}

		// Clear previous timeout
		if (usernameCheckTimeoutRef.current) {
			clearTimeout(usernameCheckTimeoutRef.current)
		}

		// Validate username format
		const usernameRegex = /^[a-zA-Z0-9_-]+$/
		if (!usernameRegex.test(username)) {
			setUsernameError("Username can only contain letters, numbers, underscores, and hyphens")
			return
		}

		if (username.length < 3) {
			setUsernameError("Username must be at least 3 characters")
			return
		}

		if (username.length > 50) {
			setUsernameError("Username must be less than 50 characters")
			return
		}

		// Debounce username check
		usernameCheckTimeoutRef.current = setTimeout(async () => {
			setIsCheckingUsername(true)
			setUsernameError(null)

			try {
				const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
				const result = await response.json()

				if (!result.success) {
					setUsernameError(result.message || "Error checking username")
				} else if (!result.data.available) {
					setUsernameError("Username is already taken")
				}
			} catch (error) {
				console.error("Error checking username:", error)
				setUsernameError("Error checking username availability")
			} finally {
				setIsCheckingUsername(false)
			}
		}, 500)

		return () => {
			if (usernameCheckTimeoutRef.current) {
				clearTimeout(usernameCheckTimeoutRef.current)
			}
		}
	}, [username])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!firstName.trim() || !lastName.trim() || !username.trim()) {
			return
		}

		if (usernameError || isCheckingUsername) {
			return
		}

		onNext({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			username: username.trim(),
			avatarUrl: avatarUrl.trim() || undefined,
		})
	}

	const isFormValid = firstName.trim() && lastName.trim() && username.trim() && !usernameError && !isCheckingUsername

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Profile</h2>
				<p className="text-gray-600">Let's set up your profile to get started</p>
			</div>

			<div className="space-y-4">
				<div>
					<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
						First Name <span className="text-red-500">*</span>
					</label>
					<input
						id="firstName"
						type="text"
						required
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						placeholder="John"
					/>
				</div>

				<div>
					<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
						Last Name <span className="text-red-500">*</span>
					</label>
					<input
						id="lastName"
						type="text"
						required
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						placeholder="Doe"
					/>
				</div>

				<div>
					<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
						Username <span className="text-red-500">*</span>
					</label>
					<input
						id="username"
						type="text"
						required
						value={username}
						onChange={(e) => setUsername(e.target.value.toLowerCase())}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						placeholder="johndoe"
					/>
					{isCheckingUsername && (
						<p className="mt-1 text-sm text-gray-600">Checking availability...</p>
					)}
					{usernameError && (
						<p className="mt-1 text-sm text-red-600">{usernameError}</p>
					)}
					{!usernameError && username.trim().length > 0 && !isCheckingUsername && (
						<p className="mt-1 text-sm text-green-600">✓ Username available</p>
					)}
				</div>

				<div>
					<label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
						Avatar URL (optional)
					</label>
					<input
						id="avatarUrl"
						type="url"
						value={avatarUrl}
						onChange={(e) => setAvatarUrl(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						placeholder="https://example.com/avatar.jpg"
					/>
					<p className="mt-1 text-sm text-gray-600">Add a profile picture URL (optional)</p>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={!isFormValid}
					className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
				</button>
			</div>
		</form>
	)
}

