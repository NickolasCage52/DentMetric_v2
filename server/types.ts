export interface UserRecord {
  userId: string
  firstSeenAt: string
  registeredAt: string
}

export interface EventRecord {
  userId: string
  event: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface StatsResponse {
  totalUsers: number
}
