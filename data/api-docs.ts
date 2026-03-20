export interface ApiParam {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ApiAction {
  name: string;
  description: string;
  params?: ApiParam[];
  returns: string;
}

export interface ApiDomain {
  id: string;
  label: string;
  actions: ApiAction[];
}

export const API_DOCS: ApiDomain[] = [
  // ── Training ───────────────────────────────────────────────────────────────
  {
    id: "training",
    label: "Training",
    actions: [
      { name: "createSession", description: "Create a new empty workout session.", params: [{ name: "date", type: "string (YYYY-MM-DD)", required: true }, { name: "name", type: "string" }, { name: "bodyTarget", type: "BodyTarget", required: true }, { name: "notes", type: "string" }], returns: "ActionResult<{ id }>" },
      { name: "addExerciseToSession", description: "Log one or more sets of an exercise to an existing session.", params: [{ name: "sessionId", type: "string", required: true }, { name: "exercise", type: "string", required: true }, { name: "sets", type: "{ setNumber, weight, weightUnit, reps }[]", required: true }], returns: "ActionResult" },
      { name: "getWorkoutSessions", description: "List all sessions for the current user, newest first.", returns: "ActionResult<WorkoutSession[]>" },
      { name: "getWorkoutSession", description: "Fetch a single session with all its sets, sorted by creation order.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<{ session, sets }>" },
      { name: "updateSession", description: "Edit session metadata (name, date, bodyTarget, notes).", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<SessionUpdate>", required: true }], returns: "ActionResult" },
      { name: "deleteSession", description: "Delete a session and all its sets.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "updateSet", description: "Update weight, unit, or reps on an individual set.", params: [{ name: "setId", type: "string", required: true }, { name: "data", type: "{ weight?, weightUnit?, reps? }", required: true }], returns: "ActionResult" },
      { name: "deleteSet", description: "Remove a set from a session.", params: [{ name: "setId", type: "string", required: true }], returns: "ActionResult" },
      { name: "toggleSetCompleted", description: "Toggle the completed state on a set (used during active workouts).", params: [{ name: "setId", type: "string", required: true }], returns: "ActionResult" },
      { name: "renameExercise", description: "Rename an exercise across all sets in a session.", params: [{ name: "sessionId", type: "string", required: true }, { name: "oldName", type: "string", required: true }, { name: "newName", type: "string", required: true }], returns: "ActionResult" },
      { name: "deleteExerciseFromSession", description: "Delete all sets for a given exercise name from a session.", params: [{ name: "sessionId", type: "string", required: true }, { name: "exerciseName", type: "string", required: true }], returns: "ActionResult" },
      { name: "getUserExercises", description: "Returns the list of all exercise names the user has ever logged.", returns: "ActionResult<string[]>" },
      { name: "addUserExercise", description: "Add a custom exercise name to the user's exercise library.", params: [{ name: "name", type: "string", required: true }], returns: "ActionResult" },
      { name: "deleteUserExercise", description: "Remove a custom exercise from the user's library.", params: [{ name: "name", type: "string", required: true }], returns: "ActionResult" },
      { name: "getLastWeightForExercise", description: "Returns the highest recorded weight for the given exercise name.", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<{ weight, unit } | null>" },
      { name: "getLastSessionSetsForExercise", description: "Get all sets from the most recent session that included a given exercise.", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<WorkoutSet[]>" },
      { name: "getRecentSessionsForExercise", description: "Fetch the 5 most recent sessions that included a given exercise (for progressive overload context).", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<{ session, sets }[]>" },
      { name: "setExerciseVideoUrl", description: "Attach a YouTube URL to an exercise name for reference during workouts.", params: [{ name: "exerciseName", type: "string", required: true }, { name: "url", type: "string", required: true }], returns: "ActionResult" },
      { name: "getExerciseVideos", description: "Returns a map of exercise name → YouTube URL for all exercises with videos.", returns: "ActionResult<Record<string, string>>" },
      { name: "addExerciseTag", description: "Tag an exercise with a label (e.g. 'push', 'compound').", params: [{ name: "exerciseName", type: "string", required: true }, { name: "tag", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "removeExerciseTag", description: "Remove a tag from an exercise.", params: [{ name: "exerciseName", type: "string", required: true }, { name: "tag", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "getExerciseTags", description: "Returns all exercise tags keyed by exercise name.", returns: "ActionResult<Record<string, string[]>>" },
      { name: "linkSuperset", description: "Link two or more exercise names in a session as a superset group.", params: [{ name: "sessionId", type: "string", required: true }, { name: "exerciseNames", type: "string[]", required: true }], returns: "ActionResult<void>" },
      { name: "unlinkSuperset", description: "Remove a superset grouping from a session.", params: [{ name: "sessionId", type: "string", required: true }, { name: "groupId", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "replaySession", description: "Clone a past session (its exercise/set structure) into a new session on today's date.", params: [{ name: "sessionId", type: "string", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getSessionDates", description: "Get all dates on which the user has logged workouts.", returns: "ActionResult<string[]>" },
      { name: "getPersonalRecords", description: "Returns the all-time PR (heaviest weight × reps) for each exercise.", returns: "ActionResult<PersonalRecord[]>" },
      { name: "getPRHistory", description: "Returns the full PR progression history for each exercise.", returns: "ActionResult<ExercisePRHistory[]>" },
      { name: "getVolumeHistory", description: "Aggregate daily total volume (lb) over the past 30 or 90 days.", params: [{ name: "days", type: "30 | 90", required: true }], returns: "ActionResult<VolumeDayPoint[]>" },
      { name: "getDashboardVolumeData", description: "Returns weekly volume aggregated by body target for the dashboard chart.", returns: "ActionResult<VolumeDashboardPoint[]>" },
      { name: "getBodyTargetDistribution", description: "Returns total volume broken down by body target for the current user.", returns: "ActionResult<BodyTargetVolume[]>" },
      { name: "getProgressiveOverloadSuggestions", description: "AI-assisted suggestions for next-session weight/rep targets per exercise.", returns: "ActionResult<ProgressiveOverloadSuggestion[]>" },
      { name: "getDeloadRecommendation", description: "Analyses recent session volume/frequency and recommends whether to deload.", returns: "ActionResult<DeloadRecommendation>" },
      { name: "getRestDaySuggestions", description: "Returns rest-day activity suggestions based on recent training load.", returns: "ActionResult<RestDaySuggestion[]>" },
    ],
  },

  // ── Nutrition ──────────────────────────────────────────────────────────────
  {
    id: "nutrition",
    label: "Nutrition",
    actions: [
      { name: "addDietEntry", description: "Log a food entry for the current user.", params: [{ name: "data", type: "DietEntryInput", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getDietEntries", description: "Fetch all diet entries for a given date.", params: [{ name: "date", type: "string (YYYY-MM-DD)", required: true }], returns: "ActionResult<DietEntry[]>" },
      { name: "updateDietEntry", description: "Edit an existing diet entry.", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<DietEntryInput>", required: true }], returns: "ActionResult" },
      { name: "deleteDietEntry", description: "Remove a diet entry.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "getMacroTargets", description: "Get the current user's macro targets.", returns: "ActionResult<MacroTarget | null>" },
      { name: "setMacroTargets", description: "Create or update daily macro targets.", params: [{ name: "data", type: "{ calories, protein, carbs, fat }", required: true }], returns: "ActionResult" },
      { name: "getDietDataYears", description: "Returns the list of years for which the user has diet entries (for year navigation).", returns: "ActionResult<number[]>" },
      { name: "getDietMonthlyHistory", description: "Aggregate daily macro totals for a given year+month.", params: [{ name: "year", type: "number", required: true }, { name: "month", type: "number", required: true }], returns: "ActionResult<DietDayPoint[]>" },
      { name: "getDietHistory", description: "Fetch per-day diet data for a date range (used for analytics charts).", params: [{ name: "days", type: "number", required: true }], returns: "ActionResult<DietDayPoint[]>" },
      { name: "getMacroAdherenceData", description: "Returns macro adherence percentages and streak data vs. targets.", returns: "ActionResult<MacroAdherenceData>" },
      { name: "getMacroCorrelationData", description: "Correlates daily protein intake with training volume (scatter data).", returns: "ActionResult<MacroCorrelationPoint[]>" },
      { name: "getRecentFoods", description: "Returns the most recently logged distinct food items.", params: [{ name: "limit", type: "number", description: "Default: 8" }], returns: "ActionResult<RecentFood[]>" },
      { name: "copyDietDay", description: "Copy all diet entries from a source date to a target date.", params: [{ name: "fromDate", type: "string (YYYY-MM-DD)", required: true }, { name: "toDate", type: "string (YYYY-MM-DD)", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Cardio ─────────────────────────────────────────────────────────────────
  {
    id: "cardio",
    label: "Cardio",
    actions: [
      { name: "addCardioSession", description: "Log a new cardio session.", params: [{ name: "data", type: "CardioSessionInput", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getCardioSessions", description: "List cardio sessions; optionally filter by date range.", params: [{ name: "startDate", type: "string (YYYY-MM-DD)" }, { name: "endDate", type: "string (YYYY-MM-DD)" }], returns: "ActionResult<CardioSession[]>" },
      { name: "getCardioSession", description: "Fetch a single cardio session by ID.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<CardioSession>" },
      { name: "updateCardioSession", description: "Edit a cardio session.", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<CardioSessionInput>", required: true }], returns: "ActionResult" },
      { name: "deleteCardioSession", description: "Delete a cardio session.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "getCardioHistory", description: "Returns aggregated cardio data (distance, duration, calories) for analytics charts.", params: [{ name: "days", type: "number", required: true }], returns: "ActionResult<CardioHistoryPoint[]>" },
      { name: "getCardioHrData", description: "Returns per-session heart-rate data for the past N days.", params: [{ name: "days", type: "number", description: "Default: 30" }], returns: "ActionResult<CardioHrDataPoint[]>" },
    ],
  },

  // ── Community ──────────────────────────────────────────────────────────────
  {
    id: "community",
    label: "Community",
    actions: [
      { name: "createPost", description: "Publish a community post. Restricted users cannot post.", params: [{ name: "data", type: "{ content: string, type: 'progress' | 'general' }", required: true }], returns: "ActionResult<{ id }>" },
      { name: "shareWorkoutSession", description: "Share a completed workout session as a progress post.", params: [{ name: "sessionId", type: "string", required: true }, { name: "caption", type: "string" }], returns: "ActionResult<{ id }>" },
      { name: "getPosts", description: "Fetch community feed with cursor-based pagination, excluding posts from blocked users.", params: [{ name: "cursor", type: "string" }, { name: "limit", type: "number", description: "Default: 20" }], returns: "ActionResult<{ posts: Post[], nextCursor: string | null }>" },
      { name: "deletePost", description: "Delete a post. Only the author or an admin may delete.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "blockUser", description: "Block a user so their posts no longer appear in the feed.", params: [{ name: "blockedId", type: "string", required: true }], returns: "ActionResult" },
      { name: "unblockUser", description: "Remove a block.", params: [{ name: "blockedId", type: "string", required: true }], returns: "ActionResult" },
      { name: "getBlockedUserIds", description: "Returns the list of user IDs the current user has blocked.", returns: "string[]" },
    ],
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  {
    id: "social",
    label: "Social",
    actions: [
      { name: "toggleLike", description: "Like or unlike a community post.", params: [{ name: "postId", type: "string", required: true }], returns: "ActionResult<{ liked: boolean, count: number }>" },
      { name: "addComment", description: "Add a comment to a post.", params: [{ name: "postId", type: "string", required: true }, { name: "content", type: "string", required: true }], returns: "ActionResult<Comment>" },
      { name: "deleteComment", description: "Delete a comment. Only the author or an admin may delete.", params: [{ name: "commentId", type: "string", required: true }], returns: "ActionResult" },
      { name: "getComments", description: "Fetch comments for a post.", params: [{ name: "postId", type: "string", required: true }], returns: "ActionResult<Comment[]>" },
      { name: "toggleKudos", description: "Send or retract kudos on a post.", params: [{ name: "postId", type: "string", required: true }], returns: "ActionResult<{ kudos: boolean }>" },
    ],
  },

  // ── User ───────────────────────────────────────────────────────────────────
  {
    id: "user",
    label: "User",
    actions: [
      { name: "getCurrentUser", description: "Returns the full UserSummary for the authenticated user.", returns: "ActionResult<UserSummary>" },
      { name: "updateProfile", description: "Update display name, bio, or profile image URL.", params: [{ name: "data", type: "{ displayName?, bio?, profileImage? }", required: true }], returns: "ActionResult" },
      { name: "addProfileImageToHistory", description: "Push an uploaded image URL into the user's profile image history (max 10).", params: [{ name: "url", type: "string", required: true }], returns: "ActionResult" },
      { name: "updatePreferences", description: "Update weight unit, theme, accent color, or profile visibility settings.", params: [{ name: "data", type: "PreferencesInput", required: true }], returns: "ActionResult" },
      { name: "getPublicProfile", description: "Fetch a public-safe user profile by ID, respecting the user's visibility settings.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult<PublicProfile>" },
      { name: "updateLastSeen", description: "Stamps the current user's lastSeen timestamp (called passively on navigation).", returns: "void" },
    ],
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  {
    id: "auth",
    label: "Auth",
    actions: [
      { name: "signInWithGoogle", description: "Initiates Google OAuth sign-in flow.", returns: "void (redirect)" },
      { name: "signOutAction", description: "Signs the current user out and redirects to the home page.", returns: "void (redirect)" },
    ],
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  {
    id: "goals",
    label: "Goals",
    actions: [
      { name: "createGoal", description: "Create a new fitness goal (weight target, PR target, cardio target, etc.).", params: [{ name: "input", type: "CreateGoalInput", required: true }], returns: "ActionResult" },
      { name: "getGoals", description: "List all goals for the current user, newest first.", returns: "ActionResult<Goal[]>" },
      { name: "cancelGoal", description: "Mark a goal as cancelled.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "deleteGoal", description: "Permanently delete a goal.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "checkGoalProgress", description: "Evaluates all active goals against current data and returns triggered alerts.", returns: "ActionResult<{ alerts: GoalAlert[] }>" },
    ],
  },

  // ── Injuries ───────────────────────────────────────────────────────────────
  {
    id: "injuries",
    label: "Injuries",
    actions: [
      { name: "logInjury", description: "Record a new injury or pain note.", params: [{ name: "data", type: "LogInjuryInput", required: true }], returns: "ActionResult<{ id: string }>" },
      { name: "getInjuries", description: "List all injury records for the current user.", returns: "ActionResult<Injury[]>" },
      { name: "resolveInjury", description: "Mark an injury as resolved with the current date.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "deleteInjury", description: "Permanently delete an injury record.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Challenges ─────────────────────────────────────────────────────────────
  {
    id: "challenges",
    label: "Challenges",
    actions: [
      { name: "createChallenge", description: "Create a new community challenge.", params: [{ name: "data", type: "{ title, description, metric, targetValue, unit, endsAt }", required: true }], returns: "ActionResult" },
      { name: "joinChallenge", description: "Join an active challenge.", params: [{ name: "challengeId", type: "string", required: true }], returns: "ActionResult" },
      { name: "leaveChallenge", description: "Leave a challenge you have joined.", params: [{ name: "challengeId", type: "string", required: true }], returns: "ActionResult" },
      { name: "deleteChallenge", description: "Delete a challenge. Admin or creator only.", params: [{ name: "challengeId", type: "string", required: true }], returns: "ActionResult" },
      { name: "getChallenges", description: "List all challenges, ordered by creation date.", returns: "ActionResult<Challenge[]>" },
      { name: "getChallengeLeaderboard", description: "Returns ranked participant progress for a challenge.", params: [{ name: "challengeId", type: "string", required: true }], returns: "ActionResult<ChallengeEntry[]>" },
    ],
  },

  // ── Body Weight ────────────────────────────────────────────────────────────
  {
    id: "body-weight",
    label: "Body Weight",
    actions: [
      { name: "addBodyWeight", description: "Log a body weight entry.", params: [{ name: "data", type: "{ weight: number, unit: string, date?: string }", required: true }], returns: "ActionResult" },
      { name: "getBodyWeightHistory", description: "Fetch all body weight entries for the current user, oldest first.", returns: "ActionResult<BodyWeightEntry[]>" },
      { name: "updateBodyWeight", description: "Edit an existing body weight entry.", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "{ weight, unit }", required: true }], returns: "ActionResult" },
      { name: "deleteBodyWeight", description: "Delete a body weight entry.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Physique ───────────────────────────────────────────────────────────────
  {
    id: "physique",
    label: "Physique",
    actions: [
      { name: "addPhysiqueMeasurement", description: "Log a physique measurement (chest, waist, hips, arms, etc.).", params: [{ name: "data", type: "{ measurements: Record<string, number>, unit: string, date?: string }", required: true }], returns: "ActionResult" },
      { name: "getPhysiqueMeasurements", description: "Fetch all physique measurement entries for the current user.", returns: "ActionResult<PhysiqueMeasurement[]>" },
      { name: "deletePhysiqueMeasurement", description: "Delete a physique measurement entry.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Progress Photos ────────────────────────────────────────────────────────
  {
    id: "progress-photos",
    label: "Progress Photos",
    actions: [
      { name: "addProgressPhoto", description: "Save a progress photo URL with an optional note.", params: [{ name: "data", type: "{ url: string, note?: string, date?: string }", required: true }], returns: "ActionResult" },
      { name: "getProgressPhotos", description: "Fetch all progress photos for the current user, newest first.", returns: "ActionResult<ProgressPhoto[]>" },
      { name: "deleteProgressPhoto", description: "Delete a progress photo record.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Supplements ────────────────────────────────────────────────────────────
  {
    id: "supplements",
    label: "Supplements",
    actions: [
      { name: "addSupplementLog", description: "Log a supplement intake entry.", params: [{ name: "data", type: "{ name: string, dose?: string, date?: string }", required: true }], returns: "ActionResult" },
      { name: "getSupplementLogs", description: "Fetch supplement logs for a given date (or today if omitted).", params: [{ name: "date", type: "string (YYYY-MM-DD)" }], returns: "ActionResult<SupplementLog[]>" },
      { name: "deleteSupplementLog", description: "Delete a supplement log entry.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "getUniqueSupplementNames", description: "Returns deduplicated list of supplement names the user has ever logged (for autocomplete).", returns: "ActionResult<string[]>" },
    ],
  },

  // ── Streak ─────────────────────────────────────────────────────────────────
  {
    id: "streak",
    label: "Streak",
    actions: [
      { name: "getStreak", description: "Returns the current user's streak data (current streak, longest streak, freeze count).", returns: "ActionResult<Streak>" },
      { name: "updateStreak", description: "Recalculates and persists the user's streak based on recent activity (called server-side on login).", returns: "void" },
      { name: "useStreakFreeze", description: "Consume a streak freeze to protect the current streak for today.", returns: "ActionResult" },
    ],
  },

  // ── Programs ───────────────────────────────────────────────────────────────
  {
    id: "programs",
    label: "Programs",
    actions: [
      { name: "getPrograms", description: "List all workout programs the current user has created.", returns: "ActionResult<WorkoutProgram[]>" },
      { name: "createProgram", description: "Create a new workout program from a list of template days.", params: [{ name: "data", type: "{ name: string, days: ProgramDay[] }", required: true }], returns: "ActionResult" },
      { name: "deleteProgram", description: "Delete a workout program.", params: [{ name: "programId", type: "string", required: true }], returns: "ActionResult" },
      { name: "applyProgram", description: "Apply a program day's template as a new workout session.", params: [{ name: "programId", type: "string", required: true }, { name: "dayIndex", type: "number", required: true }], returns: "ActionResult<{ sessionId: string }>" },
    ],
  },

  // ── Food & Barcode ─────────────────────────────────────────────────────────
  {
    id: "food",
    label: "Food & Barcode",
    actions: [
      { name: "searchFoods", description: "Search the Open Food Facts database and community foods by name.", params: [{ name: "query", type: "string", required: true }], returns: "ActionResult<FoodSearchResult[]>" },
      { name: "lookupBarcode", description: "Look up a food product by barcode (UPC/EAN) via Open Food Facts.", params: [{ name: "barcode", type: "string", required: true }], returns: "ActionResult<FoodSearchResult | null>" },
      { name: "getFavoriteFoods", description: "Returns the current user's saved favourite foods.", returns: "ActionResult<FavoriteFood[]>" },
      { name: "addFavoriteFood", description: "Save a food item to the user's favourites.", params: [{ name: "food", type: "FoodSearchResult", required: true }], returns: "ActionResult" },
      { name: "removeFavoriteFood", description: "Remove a food from the user's favourites by name.", params: [{ name: "name", type: "string", required: true }], returns: "ActionResult" },
      { name: "submitCommunityFood", description: "Submit a custom food entry to the shared community food database.", params: [{ name: "data", type: "CommunityFoodInput", required: true }], returns: "ActionResult" },
      { name: "getCommunityFoods", description: "Search or list community-submitted food entries.", params: [{ name: "query", type: "string" }], returns: "ActionResult<CommunityFood[]>" },
      { name: "deleteCommunityFood", description: "Delete a community food entry. Admin or submitter only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Meal Templates ─────────────────────────────────────────────────────────
  {
    id: "meal-templates",
    label: "Meal Templates",
    actions: [
      { name: "getMealTemplates", description: "List all saved meal templates for the current user.", returns: "ActionResult<MealTemplate[]>" },
      { name: "createMealTemplate", description: "Save the current day's diet entries as a named template.", params: [{ name: "data", type: "{ name: string, entries: DietEntryInput[] }", required: true }], returns: "ActionResult" },
      { name: "deleteMealTemplate", description: "Delete a meal template.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "applyMealTemplate", description: "Apply a meal template by logging all its entries for a given date.", params: [{ name: "templateId", type: "string", required: true }, { name: "date", type: "string (YYYY-MM-DD)", required: true }], returns: "ActionResult" },
    ],
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  {
    id: "reports",
    label: "Reports",
    actions: [
      { name: "getDietWeekReport", description: "Returns a structured weekly diet summary with macro averages, adherence, and top foods.", params: [{ name: "weekStart", type: "string (YYYY-MM-DD)", required: true }], returns: "ActionResult<DietWeekReport>" },
      { name: "getMonthlyReport", description: "Returns a month-level summary of training volume, cardio, and nutrition adherence.", params: [{ name: "year", type: "number", required: true }, { name: "month", type: "number", required: true }], returns: "ActionResult<MonthlyReport>" },
    ],
  },

  // ── Leaderboards ───────────────────────────────────────────────────────────
  {
    id: "leaderboards",
    label: "Leaderboards",
    actions: [
      { name: "getLeaderboard", description: "Global leaderboard ranked by total training volume (lb) in the past 30 days.", returns: "ActionResult<LeaderboardEntry[]>" },
      { name: "getBodyTargetLeaderboard", description: "Leaderboard filtered by body target (e.g. 'Chest', 'Legs').", params: [{ name: "bodyTarget", type: "BodyTarget", required: true }], returns: "ActionResult<LeaderboardEntry[]>" },
      { name: "getLeaderboardExercises", description: "Returns the list of exercises for which PR leaderboards exist.", returns: "ActionResult<string[]>" },
      { name: "getExercisePRLeaderboard", description: "Leaderboard ranked by personal record weight for a given exercise.", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<LeaderboardEntry[]>" },
    ],
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    id: "analytics",
    label: "Analytics",
    actions: [
      { name: "getExercisesWithHistory", description: "Returns exercise names for which the user has at least 2 logged sessions (sufficient for history charts).", returns: "ActionResult<string[]>" },
      { name: "getExerciseHistory", description: "Returns per-session max weight and total volume history for one exercise.", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<ExerciseHistoryPoint[]>" },
      { name: "getMuscleGroupWeeklyVolume", description: "Returns total volume (lb) per muscle group for the past 7 days, used by the muscle heatmap.", returns: "ActionResult<MuscleVolumeData[]>" },
      { name: "getAppleHealthTrainingSessions", description: "Returns imported Apple Health workout sessions mapped to chart-friendly data points.", returns: "ActionResult<AppleHealthSessionPoint[]>" },
    ],
  },

  // ── AI / Insights ──────────────────────────────────────────────────────────
  {
    id: "ai",
    label: "AI / Insights",
    actions: [
      { name: "generateWorkoutInsights", description: "Calls Claude to generate personalised workout coaching insights based on recent training data.", returns: "ActionResult<AIInsight[]>" },
      { name: "generateNutritionRecommendations", description: "Calls Claude to analyse recent diet data and generate nutrition recommendations.", returns: "ActionResult<AIInsight[]>" },
      { name: "generateAdminInsights", description: "Calls Claude to produce high-level platform health insights for admins. Admin only.", returns: "ActionResult<AIInsight[]>" },
      { name: "getExerciseSubstitutions", description: "Calls Claude to suggest alternative exercises given an exercise name and optional reason (injury, equipment).", params: [{ name: "exerciseName", type: "string", required: true }, { name: "reason", type: "string" }], returns: "ActionResult<string[]>" },
      { name: "generateGroceryList", description: "Calls Claude to generate a grocery list based on recent macro targets and logged foods.", returns: "ActionResult<GroceryCategory[]>" },
    ],
  },

  // ── Guides ─────────────────────────────────────────────────────────────────
  {
    id: "guides",
    label: "Guides",
    actions: [
      { name: "processYouTubeGuide", description: "Fetch a YouTube video's transcript and extract structured training guide content via Claude. Admin only.", params: [{ name: "youtubeUrl", type: "string", required: true }, { name: "type", type: "string", required: true }, { name: "exerciseName", type: "string" }], returns: "ActionResult<TrainingGuide>" },
      { name: "getTrainingGuides", description: "List all raw training guides (extracted YouTube content). Admin only.", returns: "ActionResult<TrainingGuide[]>" },
      { name: "deleteTrainingGuide", description: "Delete a raw training guide. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "generateGuideDraft", description: "Synthesise one or more raw guides into a polished published guide draft via Claude. Admin only.", params: [{ name: "sourceGuideIds", type: "string[]", required: true }], returns: "ActionResult<PublishedGuide>" },
      { name: "getPublishedGuides", description: "List published guides; admins can include drafts.", params: [{ name: "includeDrafts", type: "boolean", description: "Default: false — admin only when true" }], returns: "ActionResult<PublishedGuide[]>" },
      { name: "getPublishedGuideBySlug", description: "Fetch a single published guide by its URL slug. Drafts are admin-only.", params: [{ name: "slug", type: "string", required: true }], returns: "ActionResult<PublishedGuide | null>" },
      { name: "updatePublishedGuide", description: "Edit title, content, or image of a published guide. Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "updates", type: "{ title?, content?, imageUrl? }", required: true }], returns: "ActionResult<PublishedGuide>" },
      { name: "publishGuide", description: "Promote a draft guide to published status. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "unpublishGuide", description: "Revert a published guide back to draft status. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<void>" },
      { name: "deletePublishedGuide", description: "Permanently delete a published guide. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<void>" },
    ],
  },

  // ── Import / Export ────────────────────────────────────────────────────────
  {
    id: "import-export",
    label: "Import / Export",
    actions: [
      { name: "importWorkoutsCSV", description: "Parse and import workout sessions from a CSV file.", params: [{ name: "csvContent", type: "string", required: true }], returns: "ActionResult<{ imported: number }>" },
      { name: "importDietCSV", description: "Parse and import diet entries from a CSV file.", params: [{ name: "csvContent", type: "string", required: true }], returns: "ActionResult<{ imported: number }>" },
      { name: "importAppleHealthXML", description: "Parse an Apple Health export XML and extract cardio/workout sessions.", params: [{ name: "xmlContent", type: "string", required: true }], returns: "ActionResult<AppleHealthParsedData>" },
      { name: "importAppleHealthParsed", description: "Persist pre-parsed Apple Health data into the database.", params: [{ name: "data", type: "AppleHealthParsedData", required: true }], returns: "ActionResult<{ imported: number }>" },
      { name: "exportWorkoutsCSV", description: "Export all the user's workout sessions as a CSV string.", returns: "ActionResult<string>" },
      { name: "exportDietCSV", description: "Export all the user's diet entries as a CSV string.", returns: "ActionResult<string>" },
    ],
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    actions: [
      { name: "getSiteSettings", description: "Fetch global site settings (maintenance mode, feature flags, integrations). Admin only.", returns: "ActionResult<SiteSettingsDoc>" },
      { name: "updateSiteSettings", description: "Update maintenance mode or feature flags. Admin only.", params: [{ name: "data", type: "Partial<SiteSettingsDoc>", required: true }], returns: "ActionResult" },
      { name: "updateIntegrationSettings", description: "Update third-party integration config (API keys, toggles). Admin only.", params: [{ name: "key", type: "string", required: true }, { name: "value", type: "object", required: true }], returns: "ActionResult" },
      { name: "getIntegrationSettings", description: "Returns the integrations sub-document of site settings.", returns: "SiteSettingsDoc['integrations']" },
    ],
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    id: "admin",
    label: "Admin",
    actions: [
      { name: "getAllUsers", description: "Returns all registered users. Admin only.", returns: "ActionResult<UserSummary[]>" },
      { name: "setUserRole", description: "Change a user's role. Cannot change own role. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "role", type: "UserRole", required: true }], returns: "ActionResult" },
      { name: "toggleBan", description: "Ban or unban a user. Cannot ban self. Admin only.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult" },
      { name: "setUserRestrictions", description: "Set per-feature access restrictions for a user. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "restrictions", type: "{ training?, nutrition?, cardio?, community? }", required: true }], returns: "ActionResult" },
      { name: "setAdminPermissions", description: "Grant or revoke sub-admin permissions for a user. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "permissions", type: "AdminPermissions", required: true }], returns: "ActionResult" },
      { name: "getUserData", description: "Fetch a single user's full data including sessions, diet entries, and cardio logs. Admin only.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult<UserData>" },
      { name: "setUserAiRateLimit", description: "Override the AI request rate limit for a specific user. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "limit", type: "number", required: true }], returns: "ActionResult" },
      { name: "resetUserAiUsage", description: "Reset a user's AI usage counter for today. Admin only.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult" },
      { name: "getAiUsageToday", description: "Returns per-user AI request counts for today. Admin only.", returns: "ActionResult<{ userId, count }[]>" },
    ],
  },

  // ── Feedback ───────────────────────────────────────────────────────────────
  {
    id: "feedback",
    label: "Feedback",
    actions: [
      { name: "submitBugReport", description: "Submit a bug report from the in-app feedback form.", params: [{ name: "data", type: "BugReportInput", required: true }], returns: "ActionResult" },
      { name: "getBugReports", description: "List all bug reports. Admin / authorised sub-admin only.", returns: "ActionResult<BugReport[]>" },
      { name: "updateBugReportStatus", description: "Change the status of a bug report (open → testing → resolved). Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "status", type: "string", required: true }], returns: "ActionResult" },
      { name: "addBugReportImplementationNote", description: "Append a structured implementation note to a bug report. Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "note", type: "ImplementationNote", required: true }], returns: "ActionResult" },
      { name: "deleteBugReport", description: "Delete a bug report. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "getOpenBugReportsForLinking", description: "Returns minimal bug report data (id + title) for open reports, used when linking related bugs.", returns: "ActionResult<{ id, title }[]>" },
      { name: "submitSuggestion", description: "Submit a feature suggestion from the in-app feedback form.", params: [{ name: "data", type: "SuggestionInput", required: true }], returns: "ActionResult" },
      { name: "getUserSuggestions", description: "List all user suggestions. Admin / authorised sub-admin only.", returns: "ActionResult<UserSuggestion[]>" },
      { name: "updateSuggestionStatus", description: "Change the status of a suggestion (new → testing → done). Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "status", type: "string", required: true }], returns: "ActionResult" },
      { name: "addSuggestionImplementationNote", description: "Append a structured implementation note to a suggestion. Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "note", type: "ImplementationNote", required: true }], returns: "ActionResult" },
      { name: "deleteUserSuggestion", description: "Delete a user suggestion. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "generateSiteIdeas", description: "Calls Claude to generate AI-powered improvement ideas based on recent feedback. Admin only.", returns: "ActionResult<ClaudeIdea[]>" },
      { name: "getClaudeIdeas", description: "List all AI-generated idea records. Admin only.", returns: "ActionResult<ClaudeIdea[]>" },
      { name: "acceptClaudeIdea", description: "Accept an AI idea and optionally create a suggestion from it. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "updateClaudeIdeaStatus", description: "Update the status of a Claude idea. Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "status", type: "string", required: true }], returns: "ActionResult" },
      { name: "addClaudeIdeaImplementationNote", description: "Append an implementation note to a Claude idea. Admin only.", params: [{ name: "id", type: "string", required: true }, { name: "note", type: "ImplementationNote", required: true }], returns: "ActionResult" },
      { name: "deleteClaudeIdea", description: "Delete a Claude idea record. Admin only.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "retryTooComplexIdeas", description: "Re-queue ideas marked too_complex for another generation pass. Admin only.", returns: "ActionResult<{ count: number }>" },
    ],
  },
];
