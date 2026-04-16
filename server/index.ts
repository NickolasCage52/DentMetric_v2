import express from 'express'
import cors from 'cors'
import trackRouter from './routes/track'
import adminRouter from './routes/admin'
import { getMeta, getTotalUserCount } from './db/storage'

const app = express()
const PORT = process.env.PORT || 3001

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const corsOrigin =
  process.env.ALLOWED_ORIGIN?.trim() === '*'
    ? true
    : process.env.ALLOWED_ORIGIN
      ? process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
      : defaultDevOrigins

app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  })
)
app.use(express.json({ limit: '100kb' }))

app.use('/api/track', trackRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_req, res) => {
  const meta = getMeta()
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    lastRegisteredUserAt: meta.lastRegisteredUserAt ?? null,
    totalUsers: getTotalUserCount(),
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`[DentMetric API] Running on port ${PORT}`)
})

export default app
