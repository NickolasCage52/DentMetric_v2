import {
  getUserId,
  isFirstVisit,
  isRegistrationConfirmed,
} from './userIdentity'

export interface TrackingDiagnostics {
  userId: string
  isFirstVisit: boolean
  isRegistrationConfirmed: boolean
  lastTrackingAttemptAt: string | null
  lastTrackingSuccessAt: string | null
}

export function getTrackingDiagnostics(): TrackingDiagnostics {
  return {
    userId: getUserId(),
    isFirstVisit: isFirstVisit(),
    isRegistrationConfirmed: isRegistrationConfirmed(),
    lastTrackingAttemptAt: localStorage.getItem('dm_last_track_attempt'),
    lastTrackingSuccessAt: localStorage.getItem('dm_last_track_success'),
  }
}
