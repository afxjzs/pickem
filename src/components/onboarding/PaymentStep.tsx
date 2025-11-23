"use client"

import React from "react"

interface PaymentStepProps {
	onSkip: () => void
	onComplete: () => void
}

export function PaymentStep({ onSkip, onComplete }: PaymentStepProps) {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup</h2>
				<p className="text-gray-600">Connect your payment method to participate in paid leagues</p>
			</div>

			<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
						<svg
							className="h-6 w-6 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Stripe Integration</h3>
					<p className="text-sm text-gray-600 mb-4">
						Payment setup will be available soon. You can play for free now and add payment later.
					</p>
					<div className="text-xs text-gray-500 mb-6">
						<p>Future features:</p>
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>Weekly entry fees</li>
							<li>Season passes</li>
							<li>Prize payouts</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onSkip}
					className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Skip for now
				</button>
				<button
					type="button"
					onClick={onComplete}
					className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Complete Setup
				</button>
			</div>
		</div>
	)
}

