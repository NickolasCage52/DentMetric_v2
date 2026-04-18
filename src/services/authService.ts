/**
 * APPROACH: B — mock frontend auth (нет публичных /api/auth/* для пользователей DentMetric).
 * На сервере есть только POST /api/admin/login (JWT для админки) — не используется здесь.
 *
 * TODO (Approach A): заменить тела функций на реальные вызовы API.
 * Достаточно правок в этом файле — UI и Pinia-страница без изменений.
 *
 * TODO Stage 8 (Supabase Auth): при включённом облаке заменить mock verifyOtp / login на
 * supabase.auth.signInWithOtp / verifyOtp, чтобы RLS и Storage policies видели auth.uid().
 */

const TOKEN_KEY = 'dm_auth_token';
const USER_KEY = 'dm_user_profile';
const SESSION_EXPIRY_KEY = 'dm_session_expiry';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const LEGACY_ACCOUNT_TOKEN_KEY = 'dm_account_token';
const LEGACY_ACCOUNT_PROFILE_KEY = 'dm_account_profile_cache';

export interface AuthUserProfile {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  city?: string;
  country?: string;
  currency?: string;
  language?: string;
  workExperienceYears?: number;
  avatarUrl?: string;
  planId?: string;
  planExpiresAt?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: AuthUserProfile;
  error?: string;
}

export interface OtpRequestResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() < Number(expiry);
  } catch {
    return false;
  }
}

function saveSession(token: string, user: AuthUserProfile): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    /* ignore */
  }
}

export function getSavedUser(): AuthUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
}

/** Сохранить профиль при активной сессии (локально; TODO: синхронизация с API). */
export function persistUserProfile(user: AuthUserProfile): void {
  const token = getToken();
  if (!token || !isTokenValid()) return;
  saveSession(token, user);
  saveUserToLocalRegistry(user);
}

/**
 * Миграция: ранее пользователь мог быть «в системе» только через dm_account_* (Telegram/offline).
 * Не трогаем чужие ключи localStorage — только добавляем dm_auth_* с тем же токеном и сроком.
 */
export function bootstrapAuthFromLegacyAccount(): boolean {
  if (getToken() && isTokenValid()) return false;
  let legacyToken: string | null = null;
  let raw: string | null = null;
  try {
    legacyToken = localStorage.getItem(LEGACY_ACCOUNT_TOKEN_KEY);
    raw = localStorage.getItem(LEGACY_ACCOUNT_PROFILE_KEY);
  } catch {
    return false;
  }
  if (!legacyToken || !raw) return false;
  try {
    const p = JSON.parse(raw) as {
      id?: string;
      name?: string;
      phone?: string;
      createdAt?: string;
    };
    if (!p?.id) return false;
    const user: AuthUserProfile = {
      id: p.id,
      phone: p.phone ? p.phone.replace(/\D/g, '') : undefined,
      name: p.name || '',
      planId: 'free',
      createdAt: p.createdAt || new Date().toISOString(),
    };
    saveSession(legacyToken, user);
    return true;
  } catch {
    return false;
  }
}

export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length < 10) {
    return { success: false, error: 'Неверный номер телефона' };
  }
  if (import.meta.env.DEV) {
    console.info('[Auth mock] OTP for', normalizedPhone, 'is: 1234');
  }
  return {
    success: true,
    sessionId: `mock_session_${normalizedPhone}_${Date.now()}`,
  };
}

/** Только ASCII-цифры; полноширинные U+FF10..FF19 -> 0-9 (IME / моб. клавиатуры). */
export function normalizeOtpCode(otp: string): string {
  const s = String(otp ?? '');
  const ascii = s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String(ch.charCodeAt(0) - 0xff10)
  );
  return ascii.replace(/\D/g, '').slice(0, 4);
}

export async function verifyOtp(
  phone: string,
  otp: string,
  _sessionId: string
): Promise<AuthResult> {
  const normalizedPhone = phone.replace(/\D/g, '');
  const code = normalizeOtpCode(otp);
  if (code !== '1234') {
    return { success: false, error: 'Неверный код. Попробуйте ещё раз.' };
  }
  const existingUser = findUserByPhone(normalizedPhone);
  const user: AuthUserProfile =
    existingUser || {
      id: `user_${normalizedPhone}`,
      phone: normalizedPhone,
      name: '',
      planId: 'free',
      createdAt: new Date().toISOString(),
    };

  const token = `mock_token_${user.id}_${Date.now()}`;
  saveSession(token, user);
  saveUserToLocalRegistry(user);

  return { success: true, token, user };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!email?.trim() || !password) {
    return { success: false, error: 'Введите email и пароль' };
  }
  const existingUser = findUserByEmail(email);
  if (!existingUser) {
    return { success: false, error: 'Пользователь не найден' };
  }
  const token = `mock_token_${existingUser.id}_${Date.now()}`;
  saveSession(token, existingUser);
  return { success: true, token, user: existingUser };
}

export async function registerWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  if (!email?.trim() || !password) {
    return { success: false, error: 'Введите email и пароль' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Пароль минимум 6 символов' };
  }
  if (findUserByEmail(email)) {
    return { success: false, error: 'Этот email уже зарегистрирован' };
  }
  const user: AuthUserProfile = {
    id: `user_${Date.now()}`,
    email: email.trim(),
    name: name?.trim() || '',
    planId: 'free',
    createdAt: new Date().toISOString(),
  };
  const token = `mock_token_${user.id}_${Date.now()}`;
  saveSession(token, user);
  saveUserToLocalRegistry(user);
  return { success: true, token, user };
}

export async function logout(): Promise<void> {
  clearSession();
}

const REGISTRY_KEY = 'dm_user_registry';

function getRegistry(): Record<string, AuthUserProfile> {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AuthUserProfile>;
  } catch {
    return {};
  }
}

function saveUserToLocalRegistry(user: AuthUserProfile): void {
  try {
    const registry = getRegistry();
    registry[user.id] = user;
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    /* ignore */
  }
}

function findUserByPhone(phone: string): AuthUserProfile | null {
  const registry = getRegistry();
  return Object.values(registry).find((u) => u.phone === phone) || null;
}

function findUserByEmail(email: string): AuthUserProfile | null {
  const e = email.trim().toLowerCase();
  const registry = getRegistry();
  return Object.values(registry).find((u) => u.email?.toLowerCase() === e) || null;
}
