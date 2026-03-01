/**
 * Parse DentMetric token from Authorization header.
 * Token format: dm_{userId}_{timestamp} or Bearer dm_...
 */
export function getUserIdFromToken(req: Request): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  if (!token.startsWith('dm_')) return null
  const parts = token.split('_')
  if (parts.length < 2) return null
  return parts[1]
}
