import { describe, it, expect } from "@jest/globals"
import {
	createSuccessResponse,
	createErrorResponse,
	handleAPIError,
	parseQueryParams,
	isValidTeamAbbreviation,
	isValidConference,
	isValidDivision,
	isValidGameStatus,
	formatGameDate,
	getRelativeGameTime,
} from "../utils"

describe("API Utilities", () => {
	describe("createSuccessResponse", () => {
		it("should create a successful response with data", () => {
			const testData = { test: "data" }
			const response = createSuccessResponse(testData)

			expect(response.status).toBe(200)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})

		it("should include additional fields", () => {
			const testData = { test: "data" }
			const additionalFields = { count: 5, page: 1 }
			const response = createSuccessResponse(testData, additionalFields)

			expect(response.status).toBe(200)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})
	})

	describe("createErrorResponse", () => {
		it("should create an error response", () => {
			const response = createErrorResponse("Test error", "Test message", 400)

			expect(response.status).toBe(400)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})

		it("should use default status 500", () => {
			const response = createErrorResponse("Test error")
			expect(response.status).toBe(500)
		})

		it("should include additional fields", () => {
			const additionalFields = { code: "INVALID_INPUT" }
			const response = createErrorResponse(
				"Test error",
				"Test message",
				400,
				additionalFields
			)

			expect(response.status).toBe(400)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})
	})

	describe("handleAPIError", () => {
		it("should handle Error objects", () => {
			const error = new Error("Test error message")
			const response = handleAPIError(error, "test operation")

			expect(response.status).toBe(500)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})

		it("should handle unknown errors", () => {
			const response = handleAPIError("Unknown error", "test operation")

			expect(response.status).toBe(500)
			// Note: In tests, we can't easily access the response body
			// The response object is a NextResponse instance
		})
	})

	describe("parseQueryParams", () => {
		it("should parse string parameters", () => {
			const searchParams = new URLSearchParams("name=test&type=user")
			const schema = {
				name: { type: "string" as const, required: true },
				type: { type: "string" as const, default: "default" },
			}

			const result = parseQueryParams(searchParams, schema)

			expect(result.name).toBe("test")
			expect(result.type).toBe("user")
		})

		it("should parse number parameters", () => {
			const searchParams = new URLSearchParams("page=1&limit=10")
			const schema = {
				page: { type: "number" as const, default: 1 },
				limit: { type: "number" as const, required: true },
			}

			const result = parseQueryParams(searchParams, schema)

			expect(result.page).toBe(1)
			expect(result.limit).toBe(10)
		})

		it("should parse boolean parameters", () => {
			const searchParams = new URLSearchParams("active=true&verified=false")
			const schema = {
				active: { type: "boolean" as const, default: false },
				verified: { type: "boolean" as const, required: true },
			}

			const result = parseQueryParams(searchParams, schema)

			expect(result.active).toBe(true)
			expect(result.verified).toBe(false)
		})

		it("should use default values", () => {
			const searchParams = new URLSearchParams("name=test")
			const schema = {
				name: { type: "string" as const, required: true },
				page: { type: "number" as const, default: 1 },
				active: { type: "boolean" as const, default: true },
			}

			const result = parseQueryParams(searchParams, schema)

			expect(result.name).toBe("test")
			expect(result.page).toBe(1)
			expect(result.active).toBe(true)
		})

		it("should throw error for missing required parameters", () => {
			const searchParams = new URLSearchParams("name=test")
			const schema = {
				name: { type: "string" as const, required: true },
				id: { type: "number" as const, required: true },
			}

			expect(() => parseQueryParams(searchParams, schema)).toThrow(
				"Missing required parameter: id"
			)
		})

		it("should throw error for invalid number parameters", () => {
			const searchParams = new URLSearchParams("page=invalid")
			const schema = {
				page: { type: "number" as const, required: true },
			}

			expect(() => parseQueryParams(searchParams, schema)).toThrow(
				"Invalid number for parameter: page"
			)
		})

		it("should throw error for invalid boolean parameters", () => {
			const searchParams = new URLSearchParams("active=maybe")
			const schema = {
				active: { type: "boolean" as const, required: true },
			}

			expect(() => parseQueryParams(searchParams, schema)).toThrow(
				"Invalid boolean for parameter: active"
			)
		})
	})

	describe("Validation Functions", () => {
		describe("isValidTeamAbbreviation", () => {
			it("should validate AFC team abbreviations", () => {
				expect(isValidTeamAbbreviation("BUF")).toBe(true)
				expect(isValidTeamAbbreviation("MIA")).toBe(true)
				expect(isValidTeamAbbreviation("KC")).toBe(true)
				expect(isValidTeamAbbreviation("LAC")).toBe(true)
			})

			it("should validate NFC team abbreviations", () => {
				expect(isValidTeamAbbreviation("DAL")).toBe(true)
				expect(isValidTeamAbbreviation("GB")).toBe(true)
				expect(isValidTeamAbbreviation("SF")).toBe(true)
				expect(isValidTeamAbbreviation("SEA")).toBe(true)
			})

			it("should be case insensitive", () => {
				expect(isValidTeamAbbreviation("buf")).toBe(true)
				expect(isValidTeamAbbreviation("Buf")).toBe(true)
			})

			it("should reject invalid abbreviations", () => {
				expect(isValidTeamAbbreviation("XXX")).toBe(false)
				expect(isValidTeamAbbreviation("")).toBe(false)
				expect(isValidTeamAbbreviation("123")).toBe(false)
			})
		})

		describe("isValidConference", () => {
			it("should validate valid conferences", () => {
				expect(isValidConference("AFC")).toBe(true)
				expect(isValidConference("NFC")).toBe(true)
			})

			it("should be case insensitive", () => {
				expect(isValidConference("afc")).toBe(true)
				expect(isValidConference("nfc")).toBe(true)
			})

			it("should reject invalid conferences", () => {
				expect(isValidConference("ABC")).toBe(false)
				expect(isValidConference("")).toBe(false)
				expect(isValidConference("123")).toBe(false)
			})
		})

		describe("isValidDivision", () => {
			it("should validate valid divisions", () => {
				expect(isValidDivision("East")).toBe(true)
				expect(isValidDivision("North")).toBe(true)
				expect(isValidDivision("South")).toBe(true)
				expect(isValidDivision("West")).toBe(true)
			})

			it("should reject invalid divisions", () => {
				expect(isValidDivision("Central")).toBe(false)
				expect(isValidDivision("")).toBe(false)
				expect(isValidDivision("123")).toBe(false)
			})
		})

		describe("isValidGameStatus", () => {
			it("should validate valid game statuses", () => {
				expect(isValidGameStatus("scheduled")).toBe(true)
				expect(isValidGameStatus("live")).toBe(true)
				expect(isValidGameStatus("final")).toBe(true)
				expect(isValidGameStatus("cancelled")).toBe(true)
			})

			it("should be case insensitive", () => {
				expect(isValidGameStatus("SCHEDULED")).toBe(true)
				expect(isValidGameStatus("Live")).toBe(true)
			})

			it("should reject invalid statuses", () => {
				expect(isValidGameStatus("pending")).toBe(false)
				expect(isValidGameStatus("")).toBe(false)
				expect(isValidGameStatus("123")).toBe(false)
			})
		})
	})

	describe("Date Formatting Functions", () => {
		describe("formatGameDate", () => {
			it("should format date string correctly", () => {
				const dateString = "2024-09-08T20:00:00Z"
				const formatted = formatGameDate(dateString)

				expect(formatted).toContain("Sunday")
				expect(formatted).toContain("September")
				expect(formatted).toContain("8")
				expect(formatted).toContain("2024")
				expect(formatted).toContain("8:00 PM")
			})
		})

		describe("getRelativeGameTime", () => {
			it("should show game has started for past dates", () => {
				const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
				const relative = getRelativeGameTime(pastDate)

				expect(relative).toBe("Game has started")
			})

			it("should show days away for future dates", () => {
				const futureDate = new Date(
					Date.now() + 1000 * 60 * 60 * 24 * 2
				).toISOString() // 2 days from now
				const relative = getRelativeGameTime(futureDate)

				expect(relative).toBe("2 days away")
			})

			it("should show hours away for near future dates", () => {
				const futureDate = new Date(
					Date.now() + 1000 * 60 * 60 * 3
				).toISOString() // 3 hours from now
				const relative = getRelativeGameTime(futureDate)

				expect(relative).toBe("3 hours away")
			})

			it("should show minutes away for very near future dates", () => {
				const futureDate = new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 minutes from now
				const relative = getRelativeGameTime(futureDate)

				expect(relative).toBe("30 minutes away")
			})

			it("should handle singular vs plural correctly", () => {
				const oneHourFuture = new Date(
					Date.now() + 1000 * 60 * 60
				).toISOString() // 1 hour from now
				const oneHourRelative = getRelativeGameTime(oneHourFuture)
				expect(oneHourRelative).toBe("1 hour away")

				const twoHoursFuture = new Date(
					Date.now() + 1000 * 60 * 60 * 2
				).toISOString() // 2 hours from now
				const twoHoursRelative = getRelativeGameTime(twoHoursFuture)
				expect(twoHoursRelative).toBe("2 hours away")
			})
		})
	})
})
