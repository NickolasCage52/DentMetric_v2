// Simple JSON file persistence. Swap for a real DB later without
// changing any route logic — only update this file.
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'server', 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const EVENTS_FILE = path.join(DATA_DIR, 'events.json')
const META_FILE = path.join(DATA_DIR, 'meta.json')

export type StoredUser = {
  firstSeenAt: string
  registeredAt?: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJSON(file: string, data: unknown): void {
  ensureDataDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

export function getAllUsers(): Record<string, StoredUser> {
  return readJSON(USERS_FILE, {})
}

export function userExists(userId: string): boolean {
  const users = getAllUsers()
  return userId in users
}

export function registerUser(userId: string): {
  isNew: boolean
  registeredAt?: string
} {
  const users = getAllUsers()
  if (userId in users) return { isNew: false }
  const registeredAt = new Date().toISOString()
  users[userId] = { firstSeenAt: registeredAt, registeredAt }
  writeJSON(USERS_FILE, users)
  return { isNew: true, registeredAt }
}

export function getTotalUserCount(): number {
  return Object.keys(getAllUsers()).length
}

export function updateMeta(key: string, value: unknown): void {
  const meta = readJSON<Record<string, unknown>>(META_FILE, {})
  meta[key] = value
  writeJSON(META_FILE, meta)
}

export function getMeta(): Record<string, unknown> {
  return readJSON(META_FILE, {})
}

export function appendEvent(event: {
  userId: string
  event: string
  payload: Record<string, unknown>
  timestamp: string
}): void {
  const events = readJSON<typeof event[]>(EVENTS_FILE, [])
  events.push(event)
  const trimmed = events.slice(-10000)
  writeJSON(EVENTS_FILE, trimmed)
}
