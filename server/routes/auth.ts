import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { createHash, timingSafeEqual } from 'crypto'

const router = Router()

function hashPasswordUtf8(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

function passwordsEqualConstantTime(a: string, b: string): boolean {
  try {
    const ah = hashPasswordUtf8(a)
    const bh = hashPasswordUtf8(b)
    if (ah.length !== bh.length) return false
    return timingSafeEqual(ah, bh)
  } catch {
    return false
  }
}

router.post('/login', (req: Request, res: Response) => {
  const password = req.body?.password
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' })
  }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected || String(expected).length === 0) {
    return res.status(500).json({ error: 'Admin password not configured' })
  }

  const secret = process.env.ADMIN_JWT_SECRET?.trim()
  if (!secret || secret.length < 32) {
    return res.status(500).json({ error: 'Admin JWT not configured' })
  }

  if (!passwordsEqualConstantTime(password, String(expected))) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' })
  return res.json({ token })
})

export default router
