/**
 * File validation for assignment attachments.
 * Part of T-157d: File validation on upload (type + size)
 *
 * Enforces:
 * - Allowed MIME types: PDF, JPEG, PNG
 * - Max file size: 10MB
 * - File name sanitization
 */

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILE_SIZE_LABEL = '10 MB'

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFileName?: string
}

/**
 * Validate a file for upload as an assignment attachment.
 * Returns { valid, error?, sanitizedFileName? }
 */
export function validateAttachment(file: File): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExts = ALLOWED_EXTENSIONS.join(', ')

    // Some browsers send empty MIME for certain files — try extension fallback
    if (ext && ALLOWED_EXTENSIONS.includes(`.${ext}` as typeof ALLOWED_EXTENSIONS[number])) {
      // Extension matches, allow it (browser just didn't detect MIME)
    } else {
      return {
        valid: false,
        error: `File type not allowed. Accepted types: ${allowedExts}`,
      }
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum size: ${MAX_FILE_SIZE_LABEL}`,
    }
  }

  // Sanitize file name
  const sanitizedFileName = sanitizeFileName(file.name)

  return {
    valid: true,
    sanitizedFileName,
  }
}

/**
 * Sanitize a file name for storage.
 * - Remove path traversal characters
 * - Replace spaces with hyphens
 * - Limit length
 * - Preserve extension
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory paths
  const baseName = fileName.split('/').pop()?.split('\\').pop() || fileName

  // Split into name and extension
  const lastDot = baseName.lastIndexOf('.')
  const name = lastDot > 0 ? baseName.substring(0, lastDot) : baseName
  const ext = lastDot > 0 ? baseName.substring(lastDot).toLowerCase() : ''

  // Sanitize the name part
  const sanitized = name
    .replace(/[^a-zA-Z0-9_-]/g, '-')  // Replace non-alphanumeric chars
    .replace(/-+/g, '-')                // Collapse multiple hyphens
    .replace(/^-|-$/g, '')              // Remove leading/trailing hyphens
    .substring(0, 100)                  // Limit length

  return ext ? `${sanitized}${ext}` : sanitized
}

/**
 * Generate a unique storage path for an assignment attachment.
 * Format: {teacher_id}/{assignment_id}/{timestamp}_{sanitized_name}
 */
export function generateAttachmentPath(teacherId: string, assignmentId: string, fileName: string): string {
  const sanitized = sanitizeFileName(fileName)
  const timestamp = Date.now()
  return `${teacherId}/${assignmentId}/${timestamp}_${sanitized}`
}