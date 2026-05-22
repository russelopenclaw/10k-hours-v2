export type AppError = {
  message: string
  code?: string
  details?: string
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  const e = err as { message?: string; code?: string; error_description?: string; msg?: string }
  if (e?.message) return e.message
  if (e?.error_description) return e.error_description
  if (e?.msg) return e.msg
  if (e?.code) return `Error: ${e.code}`
  return 'An unexpected error occurred'
}