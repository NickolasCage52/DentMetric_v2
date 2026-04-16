import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUserId,
  isFirstVisit,
  markUserAsRegistered,
  isRegistrationConfirmed,
  markRegistrationConfirmed,
} from '../src/services/userIdentity'

const USER_ID_KEY = 'dm_user_id'
const USER_REGISTERED_KEY = 'dm_user_registered'
const USER_REGISTRATION_CONFIRMED_KEY = 'dm_user_reg_confirmed'

describe('userIdentity', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getUserId is idempotent and persists', () => {
    const a = getUserId()
    const b = getUserId()
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f-]{36}$/)
    expect(localStorage.getItem(USER_ID_KEY)).toBe(a)
  })

  it('isFirstVisit until markUserAsRegistered', () => {
    expect(isFirstVisit()).toBe(true)
    markUserAsRegistered()
    expect(isFirstVisit()).toBe(false)
    expect(localStorage.getItem(USER_REGISTERED_KEY)).toBe('true')
  })

  it('isRegistrationConfirmed after markRegistrationConfirmed', () => {
    expect(isRegistrationConfirmed()).toBe(false)
    markRegistrationConfirmed()
    expect(isRegistrationConfirmed()).toBe(true)
    expect(localStorage.getItem(USER_REGISTRATION_CONFIRMED_KEY)).toBe('true')
  })
})
