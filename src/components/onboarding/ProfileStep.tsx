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
			setUsernameError(
				"Username can only contain letters, numbers, underscores, and hyphens"
			)
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
				// Retry logic for production where session might not be immediately available
				let lastError: string | null = null
				let retries = 2

				while (retries >= 0) {
					const response = await fetch(
						`/api/users/check-username?username=${encodeURIComponent(
							username
						)}`,
						{
							credentials: "include",
							headers: {
								"Cache-Control": "no-cache",
							},
						}
					)
					const result = await response.json()

					if (!result.success) {
						// If it's a 401 and we have retries left, wait a bit and retry
						if (response.status === 401 && retries > 0) {
							lastError = result.message || "Error checking username"
							await new Promise((resolve) => setTimeout(resolve, 500))
							retries--
							continue
						}
						setUsernameError(result.message || "Error checking username")
						break
					} else if (!result.data.available) {
						setUsernameError("Username is already taken")
						break
					} else {
						// Success - username is available
						break
					}
				}

				if (lastError && retries < 0) {
					setUsernameError(lastError)
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

	const isFormValid =
		firstName.trim() &&
		lastName.trim() &&
		username.trim() &&
		!usernameError &&
		!isCheckingUsername

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<h2 className="text-2xl font-galindo text-[#265387] mb-2">
					Create Your Profile
				</h2>
				<p className="text-gray-600">
					Let's set up your profile to get started
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<label
						htmlFor="firstName"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						First Name <span className="text-red-500">*</span>
					</label>
					<input
						id="firstName"
						type="text"
						required
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						className="w-full px-3 py-2 border-2 border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC]"
						placeholder="Tom"
					/>
				</div>

				<div>
					<label
						htmlFor="lastName"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Last Name <span className="text-red-500">*</span>
					</label>
					<input
						id="lastName"
						type="text"
						required
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						className="w-full px-3 py-2 border-2 border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC]"
						placeholder="Brady"
					/>
				</div>

				<div>
					<label
						htmlFor="username"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Username <span className="text-red-500">*</span>
					</label>
					<input
						id="username"
						type="text"
						required
						value={username}
						onChange={(e) => setUsername(e.target.value.toLowerCase())}
						className="w-full px-3 py-2 border-2 border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC]"
						placeholder="the_goat"
					/>
					{isCheckingUsername && (
						<p className="mt-1 text-sm text-gray-600">
							Checking availability...
						</p>
					)}
					{usernameError && (
						<p className="mt-1 text-sm text-red-600">{usernameError}</p>
					)}
					{!usernameError &&
						username.trim().length > 0 &&
						!isCheckingUsername && (
							<p className="mt-1 text-sm text-green-600">
								✓ Username available
							</p>
						)}
				</div>

				<div>
					<label
						htmlFor="avatarUrl"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Avatar URL (optional)
					</label>
					<input
						id="avatarUrl"
						type="url"
						value={avatarUrl}
						onChange={(e) => setAvatarUrl(e.target.value)}
						className="w-full px-3 py-2 border-2 border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC]"
						placeholder="https://example.com/avatar.jpg"
					/>
					<p className="mt-1 text-sm text-gray-600">
						Add a profile picture URL (optional)
					</p>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={!isFormValid}
					className="px-6 py-2 bg-[#4580BC] text-white rounded-md hover:bg-[#265387] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4580BC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Continue
				</button>
			</div>
		</form>
	)
}
