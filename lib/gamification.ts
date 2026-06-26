/**
 * Username validation and profanity filter for Cadent.
 * 
 * Three layers of defense:
 * 1. Character restrictions — only letters, numbers, underscores, hyphens
 * 2. Length requirements — 2-30 characters
 * 3. Profanity blocklist — reject known inappropriate words
 * 
 * The blocklist is a curated set of the most common inappropriate terms.
 * For production, consider using a comprehensive library like `bad-words`
 * or an API like PurgoMalum for real-time filtering.
 */

// Curated blocklist of inappropriate words for usernames.
// This covers the most common categories. For a more comprehensive list,
// consider using a package like `bad-words` or the LDNOOBW list on GitHub.
const PROFANITY_BLOCKLIST: string[] = [
  // Explicit terms
  'fuck', 'shit', 'ass', 'bitch', 'dick', 'cock', 'pussy', 'cunt', 'whore',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  // Drug references
  'weed', 'cocaine', 'heroin', 'meth', 'crack',
  // Violence/hate
  'nazi', 'kkk', 'terrorist', 'suicide', 'kill',
  // Sexual
  'porn', 'xxx', 'sex', 'sexy', 'nude', 'naked', 'nsfw',
  // Common attempts to bypass
  'fuk', 'sh1t', 'azz', 'b1tch', 'd1ck', 'c0ck',
  'f4ggot', 'r3tard', 'n1gger',
  // Body shaming / bullying
  'fatass', 'dumbass', 'jackass',
]

// Characters allowed in usernames
const ALLOWED_USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/

// Reserved usernames that shouldn't be used
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'mod', 'support', 'help',
  'system', 'cadent', 'teacher', 'student', 'test', 'null', 'undefined',
  'everyone', 'all', 'me', 'you', 'anonymous',
]

export interface UsernameValidationResult {
  valid: boolean
  reason?: string
  sanitized?: string
}

/**
 * Validate a username for appropriateness.
 * Returns { valid: true } if the username passes all checks,
 * or { valid: false, reason: "..." } if it fails.
 */
export function validateUsername(username: string): UsernameValidationResult {
  const trimmed = username.trim()
  
  // Check length
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Username must be at least 2 characters' }
  }
  if (trimmed.length > 30) {
    return { valid: false, reason: 'Username must be 30 characters or less' }
  }
  
  // Check allowed characters
  if (!ALLOWED_USERNAME_PATTERN.test(trimmed)) {
    return { valid: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  // Check reserved names
  if (RESERVED_USERNAMES.includes(trimmed.toLowerCase())) {
    return { valid: false, reason: 'That username isn\'t available' }
  }
  
  // Check profanity
  const lowerUsername = trimmed.toLowerCase()
  for (const word of PROFANITY_BLOCKLIST) {
    if (lowerUsername.includes(word)) {
      // Don't tell them it was flagged as profanity — just say it's not available
      return { valid: false, reason: 'That username isn\'t available' }
    }
  }
  
  return { valid: true, sanitized: trimmed }
}

/**
 * Get a display-friendly version of a name.
 * Falls back through: display_name → full_name → email prefix
 */
export function getDisplayName(profile: {
  display_name?: string | null
  full_name?: string | null
  email?: string
}): string {
  if (profile.display_name?.trim()) return profile.display_name.trim()
  if (profile.full_name?.trim()) return profile.full_name.trim()
  if (profile.email) return profile.email.split('@')[0]
  return 'Musician'
}

/**
 * Calculate streak multiplier based on current streak length.
 * 3-day streak: 1.5x
 * 7-day streak: 2x
 * 14-day streak: 3x
 * 30-day streak: 5x
 * Cap: 5x
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 5.0
  if (streakDays >= 14) return 3.0
  if (streakDays >= 7) return 2.0
  if (streakDays >= 3) return 1.5
  return 1.0
}

/**
 * Calculate points earned for a practice session.
 * 1 point per minute, multiplied by streak multiplier, rounded down.
 */
export function calculateCoinsEarned(durationMinutes: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays)
  return Math.floor(durationMinutes * multiplier)
}

/**
 * Streak multiplier display text.
 */
export function getStreakMultiplierLabel(streakDays: number): string {
  const multiplier = getStreakMultiplier(streakDays)
  if (multiplier === 1.0) return ''
  return `${multiplier}x`
}