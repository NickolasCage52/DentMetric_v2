import { Router, type Request, type Response } from 'express'
import { getTotalUserCount, getMeta } from '../db/storage'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()

router.get('/stats', requireAdmin, (_req: Request, res: Response) => {
  const meta = getMeta()
  const totalUsers = getTotalUserCount()

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.set('Pragma', 'no-cache')

  res.json({
    totalUsers,
    lastRegisteredUserAt: meta.lastRegisteredUserAt ?? null,
    lastStatsSyncAt: new Date().toISOString(),
    trackingStatus: 'active',
    storageStatus: totalUsers >= 0 ? 'ok' : 'error',
  })
})

export default router
