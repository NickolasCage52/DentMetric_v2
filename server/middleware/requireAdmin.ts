import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_JWT_SECRET?.trim()
  if (!secret || secret.length < 32) {
    return res.status(500).json({ error: 'Admin JWT not configured' })
  }

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, secret) as { role?: string }
    if (payload.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
