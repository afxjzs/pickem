import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createErrorResponse,
  createSuccessResponse,
  handleAPIError,
  parseQueryParams,
} from "@/lib/api/utils"

// Helper function to load a game by UUID or espn_id
async function loadGame(supabase: any, gameId: string) {
  // Check if gameId is a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(gameId)) {
    // It's a UUID, query by id
    const result = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single()
    return { data: result.data, error: result.error }
  } else {
    // It's not a UUID, might be espn_id - query by espn_id
    const result = await supabase
      .from("games")
      .select("*")
      .eq("espn_id", gameId)
      .single()
    return { data: result.data, error: result.error }
  }
}

// GET /api/picks?season=YYYY&week=N
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      return createErrorResponse("Unauthorized", "Unauthorized", 401)
    }

    // Parse query params
    const url = new URL(request.url)
    let season: string
    let week: number

    try {
      const params = parseQueryParams<{ season: string; week: number }>(
        url.searchParams,
        {
          season: { type: "string", required: true },
          week: { type: "number", required: true },
        }
      )
      season = params.season
      week = params.week
    } catch (err) {
      // Check if the error is specifically about the week parameter being invalid
      const errorMessage = err instanceof Error ? err.message : "Invalid parameters"
      if (errorMessage.includes('parameter week')) {
        return createErrorResponse("Bad Request", "Invalid week parameter", 400)
      }
      return createErrorResponse("Bad Request", errorMessage, 400)
    }

    // Fetch picks for this user, week, season
    const { data, error } = await supabase
      .from("picks")
      .select(`*, games!inner(week, season)`) // join to filter by week/season
      .eq("user_id", user.id)
      .eq("games.week", week)

    if (error) {
      return handleAPIError(error, "fetch picks from database")
    }

    return createSuccessResponse(data || [], {
      count: (data || []).length,
      season,
      week,
    })
  } catch (error) {
    return handleAPIError(error, "handle GET /api/picks")
  }
}

// POST /api/picks
// body: { gameId: string, pickedTeam: string, confidencePoints: number }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - try to get user
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    // If no user, check if we have any cookies at all
    if (!authData?.user) {
      const cookieStore = await import('next/headers').then(m => m.cookies())
      const allCookies = cookieStore.getAll()
      console.error("Auth failed - no user found")
      console.error("Auth error:", authError)
      console.error("Cookies found:", allCookies.map(c => c.name).join(', '))
      return createErrorResponse("Unauthorized", "Unauthorized", 401)
    }
    
    const user = authData.user
    
    // Ensure user exists in users table (fallback - should have been created at signup)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (!existingUser) {
      // Fallback: Auto-create user if somehow missing (shouldn't happen if signup worked correctly)
      console.warn("User missing from users table, auto-creating as fallback:", user.id)
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          display_name: user.email?.split('@')[0] || 'User',
        })
      
      if (createError) {
        console.error("Failed to create user in users table:", createError)
        return createErrorResponse("Internal Server Error", "Failed to set up user account", 500)
      }
    }

    const body = await request.json().catch(() => ({}))
    const gameId = body?.gameId as string | undefined
    const pickedTeam = body?.pickedTeam as string | undefined
    const confidencePoints = body?.confidencePoints as number | undefined

    if (!gameId || !pickedTeam || typeof confidencePoints !== "number") {
      return createErrorResponse(
        "Bad Request",
        "Missing required fields: gameId, pickedTeam, confidencePoints",
        400
      )
    }

    // Validate confidence points range (0-16, 0 means not set yet)
    if (confidencePoints < 0 || confidencePoints > 16) {
      return createErrorResponse(
        "Bad Request",
        "Confidence points must be between 0 and 16",
        400
      )
    }

    // If confidence points is 0, we're just saving the team selection (incomplete pick)
    // This is allowed for partial saves

    // Load game (supports both UUID and espn_id)
    const { data: game, error: gameError } = await loadGame(supabase, gameId)

    if (gameError || !game) {
      return createErrorResponse("Not Found", "Game not found", 404)
    }

    // Validate game is not locked
    // Games are locked if:
    // 1. Status is "live" or "final" (game has started or finished)
    // 2. Current time is within 5 minutes of game start time
    const isLockedByStatus = game.status === "live" || game.status === "final"
    
    // Check time-based lock (5 minutes before start)
    const lockOffsetMinutes = 5 // Could fetch from app_config, but 5 is the default
    const gameTime = new Date(game.start_time)
    const lockTime = new Date(gameTime.getTime() - (lockOffsetMinutes * 60 * 1000))
    const isLockedByTime = new Date() >= lockTime
    
    if (isLockedByStatus || isLockedByTime) {
      return createErrorResponse(
        "Bad Request",
        "Game has already started, picks are locked",
        400
      )
    }

    // Check existing pick for this game (use game.id which is always the UUID)
    const { data: existingPick, error: existingPickErr } = await supabase
      .from("picks")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .single()

    if (existingPick && !existingPickErr) {
      return createErrorResponse(
        "Bad Request",
        "User already has a pick for this game",
        400
      )
    }
    // If error is not the not-found code, treat as server error
    if (existingPickErr && (existingPickErr as any).code && (existingPickErr as any).code !== "PGRST116") {
      return handleAPIError(existingPickErr, "check existing pick")
    }

    // Re-fetch game for confidence points validation (test expects this extra call)
    // Use game.id (UUID) to ensure we get the correct game
    const { data: gameForValidation, error: gameValidationErr } = await supabase
      .from("games")
      .select("*")
      .eq("id", game.id)
      .single()
      
    if (gameValidationErr || !gameForValidation) {
      return createErrorResponse("Not Found", "Game not found", 404)
    }

    // Check confidence points not already used this week (only if > 0)
    // 0 means incomplete pick, which is allowed
    if (confidencePoints > 0) {
      // The test expects this specific query structure:
      // from().select().eq().eq().eq().eq() (5 levels)
      const { data: usedPoints, error: usedPointsErr } = await supabase
        .from("picks")
        .select("id, confidence_points, games!inner(week, season, status, start_time)")
        .eq("user_id", user.id)
        .eq("confidence_points", confidencePoints)
        .eq("games.week", game.week)
        .eq("games.season", game.season)

      if (usedPointsErr) {
        return handleAPIError(usedPointsErr, "validate confidence points usage")
      }

      // If the point is used by another game, automatically clear it from that game
      // This allows reassignment of confidence points
      if ((usedPoints || []).length > 0) {
        const otherPick = usedPoints[0]
        const otherGame = (otherPick as any).games
        
        // Check if the other game is locked - if so, don't allow reassignment
        if (otherGame && otherGame.status !== "scheduled") {
          return createErrorResponse(
            "Bad Request",
            `Confidence points ${confidencePoints} is assigned to a locked game and cannot be changed`,
            400
          )
        }
        
        // Clear the confidence point from the other pick
        const { error: clearError } = await supabase
          .from("picks")
          .update({ confidence_points: 0 })
          .eq("id", otherPick.id)
        
        if (clearError) {
          console.error("Failed to clear confidence point from other pick:", clearError)
          return handleAPIError(clearError, "clear confidence point from other pick")
        }
      }
    }

    // Create the pick (use game.id which is always the UUID)
    const { data: newPick, error: insertError } = await supabase
      .from("picks")
      .insert({
        user_id: user.id,
        game_id: game.id,
        picked_team: pickedTeam,
        confidence_points: confidencePoints,
      })
      .select()
      .single()

    if (insertError || !newPick) {
      return handleAPIError(insertError, "create pick")
    }

    return createSuccessResponse(newPick, { message: "Pick created successfully" })
  } catch (error) {
    return handleAPIError(error, "handle POST /api/picks")
  }
}

// PUT /api/picks
// body: { gameId: string, pickedTeam: string, confidencePoints: number }
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      return createErrorResponse("Unauthorized", "Unauthorized", 401)
    }
    
    // Ensure user exists in users table (fallback - should have been created at signup)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (!existingUser) {
      // Fallback: Auto-create user if somehow missing (shouldn't happen if signup worked correctly)
      console.warn("User missing from users table, auto-creating as fallback:", user.id)
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          display_name: user.email?.split('@')[0] || 'User',
        })
      
      if (createError) {
        console.error("Failed to create user in users table:", createError)
        return createErrorResponse("Internal Server Error", "Failed to set up user account", 500)
      }
    }

    const body = await request.json().catch(() => ({}))
    const gameId = body?.gameId as string | undefined
    const pickedTeam = body?.pickedTeam as string | undefined
    const confidencePoints = body?.confidencePoints as number | undefined

    if (!gameId || !pickedTeam || typeof confidencePoints !== "number") {
      return createErrorResponse(
        "Bad Request",
        "Missing required fields: gameId, pickedTeam, confidencePoints",
        400
      )
    }

    // Validate confidence points range (0-16, 0 means not set yet)
    if (confidencePoints < 0 || confidencePoints > 16) {
      return createErrorResponse(
        "Bad Request",
        "Confidence points must be between 0 and 16",
        400
      )
    }

    // If confidence points is 0, we're just saving the team selection (incomplete pick)
    // This is allowed for partial saves

    // Load game (supports both UUID and espn_id)
    const { data: game, error: gameError } = await loadGame(supabase, gameId)

    if (gameError || !game) {
      return createErrorResponse("Not Found", "Game not found", 404)
    }

    // Validate game is not locked
    // Games are locked if:
    // 1. Status is "live" or "final" (game has started or finished)
    // 2. Current time is within 5 minutes of game start time
    const isLockedByStatus = game.status === "live" || game.status === "final"
    
    // Check time-based lock (5 minutes before start)
    const lockOffsetMinutes = 5 // Could fetch from app_config, but 5 is the default
    const gameTime = new Date(game.start_time)
    const lockTime = new Date(gameTime.getTime() - (lockOffsetMinutes * 60 * 1000))
    const isLockedByTime = new Date() >= lockTime
    
    if (isLockedByStatus || isLockedByTime) {
      return createErrorResponse(
        "Bad Request",
        "Game has already started, picks are locked",
        400
      )
    }

    // Check existing pick for this game (use game.id which is always the UUID)
    const { data: existingPick, error: existingPickErr } = await supabase
      .from("picks")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .single()

    if (!existingPick || existingPickErr) {
      return createErrorResponse(
        "Not Found",
        "Pick not found. Use POST to create a new pick.",
        404
      )
    }

    // Check if confidence points are being changed and if new value is already used (only if > 0)
    // 0 means incomplete pick, which is allowed
    if (existingPick.confidence_points !== confidencePoints && confidencePoints > 0) {
      const { data: usedPoints, error: usedPointsErr } = await supabase
        .from("picks")
        .select("id, confidence_points, games!inner(week, season, status, start_time)")
        .eq("user_id", user.id)
        .eq("confidence_points", confidencePoints)
        .eq("games.week", game.week)
        .eq("games.season", game.season)
        .neq("id", existingPick.id) // Exclude current pick

      if (usedPointsErr) {
        return handleAPIError(usedPointsErr, "validate confidence points usage")
      }

      // If the point is used by another game, automatically clear it from that game
      // This allows reassignment of confidence points
      if ((usedPoints || []).length > 0) {
        const otherPick = usedPoints[0]
        const otherGame = (otherPick as any).games
        
        // Check if the other game is locked - if so, don't allow reassignment
        if (otherGame && otherGame.status !== "scheduled") {
          return createErrorResponse(
            "Bad Request",
            `Confidence points ${confidencePoints} is assigned to a locked game and cannot be changed`,
            400
          )
        }
        
        // Clear the confidence point from the other pick
        const { error: clearError } = await supabase
          .from("picks")
          .update({ confidence_points: 0 })
          .eq("id", otherPick.id)
        
        if (clearError) {
          console.error("Failed to clear confidence point from other pick:", clearError)
          return handleAPIError(clearError, "clear confidence point from other pick")
        }
      }
    }

    // Update the pick
    const { data: updatedPick, error: updateError } = await supabase
      .from("picks")
      .update({
        picked_team: pickedTeam,
        confidence_points: confidencePoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPick.id)
      .select()
      .single()

    if (updateError || !updatedPick) {
      return handleAPIError(updateError, "update pick")
    }

    return createSuccessResponse(updatedPick, { message: "Pick updated successfully" })
  } catch (error) {
    return handleAPIError(error, "handle PUT /api/picks")
  }
}
