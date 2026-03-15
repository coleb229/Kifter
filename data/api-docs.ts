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
  {
    id: "training",
    label: "Training",
    actions: [
      { name: "addExerciseToSession", description: "Log one or more sets of an exercise to an existing session.", params: [{ name: "sessionId", type: "string", required: true }, { name: "exercise", type: "string", required: true }, { name: "sets", type: "{ setNumber, weight, weightUnit, reps }[]", required: true }], returns: "ActionResult" },
      { name: "getWorkoutSession", description: "Fetch a single session with all its sets, sorted by creation order.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<{ session, sets }>" },
      { name: "getWorkoutSessions", description: "List all sessions for the current user, newest first.", returns: "ActionResult<WorkoutSession[]>" },
      { name: "createWorkoutSession", description: "Create a new empty workout session.", params: [{ name: "date", type: "string (YYYY-MM-DD)", required: true }, { name: "name", type: "string" }, { name: "bodyTarget", type: "BodyTarget", required: true }, { name: "notes", type: "string" }], returns: "ActionResult<{ id }>" },
      { name: "updateSession", description: "Edit session metadata (name, date, bodyTarget, notes).", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<SessionUpdate>", required: true }], returns: "ActionResult" },
      { name: "deleteSession", description: "Delete a session and all its sets.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "updateSet", description: "Update weight, unit, or reps on an individual set.", params: [{ name: "setId", type: "string", required: true }, { name: "data", type: "{ weight?, weightUnit?, reps? }", required: true }], returns: "ActionResult" },
      { name: "deleteSet", description: "Remove a set from a session.", params: [{ name: "setId", type: "string", required: true }], returns: "ActionResult" },
      { name: "getLastWeightForExercise", description: "Returns the highest recorded weight for the given exercise name.", params: [{ name: "exerciseName", type: "string", required: true }], returns: "ActionResult<{ weight, unit } | null>" },
    ],
  },
  {
    id: "nutrition",
    label: "Nutrition",
    actions: [
      { name: "addDietEntry", description: "Log a food entry for the current user.", params: [{ name: "data", type: "DietEntryInput", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getDietEntries", description: "Fetch all diet entries for a given date.", params: [{ name: "date", type: "string (YYYY-MM-DD)", required: true }], returns: "ActionResult<DietEntry[]>" },
      { name: "updateDietEntry", description: "Edit an existing diet entry.", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<DietEntryInput>", required: true }], returns: "ActionResult" },
      { name: "deleteDietEntry", description: "Remove a diet entry.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "getMacroTargets", description: "Get the current user's macro targets.", returns: "ActionResult<MacroTargets | null>" },
      { name: "upsertMacroTargets", description: "Create or update daily macro targets.", params: [{ name: "data", type: "{ calories, protein, carbs, fat }", required: true }], returns: "ActionResult" },
    ],
  },
  {
    id: "cardio",
    label: "Cardio",
    actions: [
      { name: "createCardioSession", description: "Log a new cardio session.", params: [{ name: "data", type: "CardioSessionInput", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getCardioSessions", description: "List all cardio sessions for the current user.", returns: "ActionResult<CardioSession[]>" },
      { name: "getCardioSession", description: "Fetch a single cardio session by ID.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult<CardioSession>" },
      { name: "updateCardioSession", description: "Edit a cardio session.", params: [{ name: "id", type: "string", required: true }, { name: "data", type: "Partial<CardioSessionInput>", required: true }], returns: "ActionResult" },
      { name: "deleteCardioSession", description: "Delete a cardio session.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
    ],
  },
  {
    id: "community",
    label: "Community",
    actions: [
      { name: "createPost", description: "Publish a community post. Restricted users cannot post.", params: [{ name: "data", type: "{ content: string, type: 'progress' | 'general' }", required: true }], returns: "ActionResult<{ id }>" },
      { name: "getPosts", description: "Fetch community feed, excluding posts from blocked users.", returns: "ActionResult<Post[]>" },
      { name: "deletePost", description: "Delete a post. Only the author or an admin may delete.", params: [{ name: "id", type: "string", required: true }], returns: "ActionResult" },
      { name: "blockUser", description: "Block a user so their posts no longer appear in the feed.", params: [{ name: "blockedId", type: "string", required: true }], returns: "ActionResult" },
      { name: "unblockUser", description: "Remove a block.", params: [{ name: "blockedId", type: "string", required: true }], returns: "ActionResult" },
    ],
  },
  {
    id: "user",
    label: "User",
    actions: [
      { name: "getCurrentUser", description: "Returns the full UserSummary for the authenticated user.", returns: "ActionResult<UserSummary>" },
      { name: "updateProfile", description: "Update display name, bio, or profile image URL.", params: [{ name: "data", type: "{ displayName?, bio?, profileImage? }", required: true }], returns: "ActionResult" },
      { name: "addProfileImageToHistory", description: "Push an uploaded image URL into the user's profile image history (max 10).", params: [{ name: "url", type: "string", required: true }], returns: "ActionResult" },
      { name: "updatePreferences", description: "Update weight unit, theme, accent color, or profile visibility settings.", params: [{ name: "data", type: "PreferencesInput", required: true }], returns: "ActionResult" },
      { name: "getPublicProfile", description: "Fetch a public-safe user profile by ID, respecting the user's visibility settings.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult<PublicProfile>" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    actions: [
      { name: "getAllUsers", description: "Returns all registered users. Admin only.", returns: "ActionResult<UserSummary[]>" },
      { name: "setUserRole", description: "Change a user's role. Cannot change own role. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "role", type: "UserRole", required: true }], returns: "ActionResult" },
      { name: "toggleBan", description: "Ban or unban a user. Cannot ban self. Admin only.", params: [{ name: "userId", type: "string", required: true }], returns: "ActionResult" },
      { name: "setUserRestrictions", description: "Set per-feature access restrictions for a user. Admin only.", params: [{ name: "userId", type: "string", required: true }, { name: "restrictions", type: "{ training?, nutrition?, cardio?, community? }", required: true }], returns: "ActionResult" },
      { name: "getSiteSettings", description: "Fetch global site settings. Admin only.", returns: "ActionResult<SiteSettingsDoc>" },
      { name: "updateSiteSettings", description: "Update maintenance mode or feature flags. Admin only.", params: [{ name: "data", type: "Partial<SiteSettingsDoc>", required: true }], returns: "ActionResult" },
    ],
  },
];
