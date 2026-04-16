import { Router, type Request, type Response } from 'express'
import {
  registerUser,
  appendEvent,
  updateMeta,
  getTotalUserCount,
} from '../db/storage'

const router = Router()

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

router.post('/event', (req: Request, res: Response) => {
  const { userId, event, payload, timestamp } = req.body

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' })
  }
  if (!UUID_REGEX.test(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' })
  }
  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'event required' })
  }

  if (event === 'user_registered') {
    const result = registerUser(userId)
    appendEvent({ userId, event, payload: payload ?? {}, timestamp })
    if (result.isNew && result.registeredAt) {
      updateMeta('lastRegisteredUserAt', result.registeredAt)
      updateMeta('totalRegistrations', getTotalUserCount())
    }
    return res.json({ status: 'ok', isNew: result.isNew })
  }

  appendEvent({ userId, event, payload: payload ?? {}, timestamp })
  return res.json({ status: 'ok' })
})

export default router
