// src/services/trackingService.ts
// Lightweight event tracking. Sends events to backend.
// Fails silently — never crashes the app if backend is unavailable.

import { getUserId, markRegistrationConfirmed } from './userIdentity'

const TRACKING_BASE_URL = import.meta.env.VITE_TRACKING_URL || '/api'

const LAST_TRACK_ATTEMPT_KEY = 'dm_last_track_attempt'
const LAST_TRACK_SUCCESS_KEY = 'dm_last_track_success'

interface TrackingEvent {
  userId: string
  event: string
  payload?: Record<string, unknown>
  timestamp: string
}

export async function trackEvent(
  event: string,
  payload?: Record<string, unknown>
): Promise<void> {
  const body: TrackingEvent = {
    userId: getUserId(),
    event,
    payload: payload ?? {},
    timestamp: new Date().toISOString(),
  }

  try {
    localStorage.setItem(LAST_TRACK_ATTEMPT_KEY, new Date().toISOString())
    const response = await fetch(`${TRACKING_BASE_URL}/track/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    if (response.ok) {
      localStorage.setItem(LAST_TRACK_SUCCESS_KEY, new Date().toISOString())
    }
  } catch {
    console.warn('[DentMetric tracking] Event failed to send:', event)
  }
}

/** Sends user_registered; returns true if the server responded OK. */
export async function trackUserRegistration(): Promise<boolean> {
  const body: TrackingEvent = {
    userId: getUserId(),
    event: 'user_registered',
    payload: {},
    timestamp: new Date().toISOString(),
  }

  try {
    localStorage.setItem(LAST_TRACK_ATTEMPT_KEY, new Date().toISOString())
    const response = await fetch(`${TRACKING_BASE_URL}/track/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    if (response.ok) {
      localStorage.setItem(LAST_TRACK_SUCCESS_KEY, new Date().toISOString())
      markRegistrationConfirmed()
      return true
    }
    return false
  } catch {
    console.warn('[DentMetric tracking] Registration send failed')
    return false
  }
}
