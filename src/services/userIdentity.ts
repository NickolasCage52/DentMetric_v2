// src/services/userIdentity.ts
// Manages anonymous user identification across sessions.
// UUID is generated once, stored in localStorage, reused forever.

const USER_ID_KEY = 'dm_user_id'
const USER_REGISTERED_KEY = 'dm_user_registered'
const USER_REGISTRATION_CONFIRMED_KEY = 'dm_user_reg_confirmed'

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export function isFirstVisit(): boolean {
  return localStorage.getItem(USER_REGISTERED_KEY) !== 'true'
}

export function markUserAsRegistered(): void {
  localStorage.setItem(USER_REGISTERED_KEY, 'true')
}

export function isRegistrationConfirmed(): boolean {
  return localStorage.getItem(USER_REGISTRATION_CONFIRMED_KEY) === 'true'
}

export function markRegistrationConfirmed(): void {
  localStorage.setItem(USER_REGISTRATION_CONFIRMED_KEY, 'true')
}

function generateUUID(): string {
  // RFC 4122 UUID v4 — no external dependency needed
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
