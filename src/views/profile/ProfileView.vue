<template>
  <div class="profile-screen">
    <div class="profile-screen__header">
      <button type="button" class="profile-screen__back" @click="$emit('back')">
        ← Назад
      </button>
      <div class="profile-screen__title">Профиль</div>
      <button
        v-if="!isEditing"
        type="button"
        class="profile-screen__edit-btn"
        @click="startEdit"
      >
        Изменить
      </button>
      <button
        v-else
        type="button"
        class="profile-screen__save-btn"
        :disabled="isSaving"
        @click="saveChanges"
      >
        {{ isSaving ? '...' : 'Сохранить' }}
      </button>
    </div>

    <div class="profile-screen__content">
      <div class="profile-screen__avatar-section">
        <div
          class="profile-screen__avatar"
          role="button"
          tabindex="0"
          @click="isEditing && pickAvatar()"
          @keydown.enter.prevent="isEditing && pickAvatar()"
        >
          <img
            v-if="draft.avatarUrl"
            :src="draft.avatarUrl"
            alt=""
            class="profile-screen__avatar-img"
          >
          <span v-else class="profile-screen__avatar-initials">{{ initials }}</span>
          <div v-if="isEditing" class="profile-screen__avatar-overlay" aria-hidden="true">
            Фото
          </div>
        </div>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleAvatarChange"
        >
      </div>

      <p v-if="!isAccountProfileComplete" class="profile-screen__hint">
        Заполните имя и телефон в профиле или пройдите
        <button type="button" class="profile-screen__hint-link" @click="$emit('navigate', 'onboarding')">
          анкету
        </button>.
      </p>

      <div class="profile-screen__section">
        <ProfileField
          label="Имя"
          :value="draft.name"
          :editing="isEditing"
          placeholder="Ваше имя"
          @update="draft.name = $event"
        />
        <ProfileField
          label="Номер телефона"
          :value="draft.phone"
          :editing="false"
          type="tel"
          placeholder="+7 900 000-00-00"
        />
        <ProfileField
          label="E-mail"
          :value="draft.email"
          :editing="isEditing"
          type="email"
          placeholder="example@mail.ru"
          @update="draft.email = $event"
        />
        <ProfileField
          label="Стаж работы"
          :value="isEditing ? (draft.workExperienceYears ?? '') : workExperienceDisplay"
          :editing="isEditing"
          type="number"
          placeholder="Лет в профессии"
          @update="onWorkExperienceInput"
        />
        <ProfileField
          label="Город"
          :value="draft.city"
          :editing="isEditing"
          placeholder="Ваш город"
          @update="draft.city = $event"
        />
        <ProfileField
          label="Страна"
          :value="draft.country"
          :editing="isEditing"
          placeholder="Россия"
          @update="draft.country = $event"
        />
        <ProfileField
          label="Валюта"
          :value="draft.currency"
          :editing="isEditing"
          placeholder="RUB"
          @update="draft.currency = $event"
        />
      </div>

      <div class="profile-screen__section profile-screen__plan-section">
        <div class="profile-screen__section-label">Тариф</div>
        <div class="profile-screen__plan-card">
          <div class="profile-screen__plan-row">
            <span class="profile-screen__plan-name">{{ planLabel }}</span>
            <span
              class="profile-screen__plan-badge"
              :class="`profile-screen__plan-badge--${normalizedPlanId}`"
            >{{ planLabel }}</span>
          </div>
          <div v-if="planExpiryLine" class="profile-screen__plan-expiry">
            {{ planExpiryLine }}
          </div>
          <button
            type="button"
            class="profile-screen__plan-upgrade"
            @click="$emit('navigate', 'tariffs')"
          >
            {{ normalizedPlanId === 'free' ? 'Перейти на платный тариф →' : 'Изменить тариф →' }}
          </button>
        </div>
      </div>

      <div class="profile-screen__section">
        <div class="profile-screen__section-label">Безопасность</div>
        <button type="button" class="profile-screen__action-row" @click="showPasswordModal = true">
          <span>Изменить пароль</span>
          <span class="profile-screen__action-chevron" aria-hidden="true">›</span>
        </button>
      </div>

      <div class="profile-screen__section profile-screen__danger-section">
        <button type="button" class="profile-screen__logout-btn" @click="handleLogout">
          Выйти
        </button>
        <button type="button" class="profile-screen__delete-btn" @click="handleDeleteAccount">
          Удалить профиль
        </button>
        <button type="button" class="profile-screen__privacy-btn" @click="$emit('navigate', 'privacy')">
          Политика конфиденциальности
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dm-fade">
        <div
          v-if="showPasswordModal"
          class="profile-screen__modal-overlay"
          @click.self="closePasswordModal"
        >
          <div class="profile-screen__modal" role="dialog" aria-labelledby="pwd-title">
            <div id="pwd-title" class="profile-screen__modal-title">Изменить пароль</div>
            <input
              v-model="newPassword"
              type="password"
              class="profile-screen__modal-input"
              placeholder="Новый пароль"
              autocomplete="new-password"
            >
            <input
              v-model="confirmPassword"
              type="password"
              class="profile-screen__modal-input"
              placeholder="Повторите пароль"
              autocomplete="new-password"
            >
            <div v-if="passwordError" class="profile-screen__modal-error">
              {{ passwordError }}
            </div>
            <button              type="button"
              class="profile-screen__modal-confirm"
              :disabled="!canSavePassword"
              @click="handlePasswordChange"
            >
              Изменить пароль
            </button>
            <button type="button" class="profile-screen__modal-cancel" @click="closePasswordModal">
              Отмена
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, toValue } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAccount } from '@/modules/account/useAccount';
import { persistUserProfile } from '@/services/authService';
import type { AuthUserProfile } from '@/services/authService';
import ProfileField from '@/components/profile/ProfileField.vue';

defineEmits<{
  back: [];
  navigate: [section: string];
}>();

const router = useRouter();
const authStore = useAuthStore();
const account = useAccount();

const isAccountProfileComplete = computed(() => toValue(account.isProfileComplete));

const isEditing = ref(false);
const isSaving = ref(false);
const draft = reactive<Partial<AuthUserProfile>>({});

function syncDraftFromStore() {
  const u = authStore.user;
  if (!u) return;
  Object.assign(draft, { ...u });
}

onMounted(() => {
  syncDraftFromStore();
});

watch(
  () => authStore.user,
  () => {
    if (!isEditing.value) syncDraftFromStore();
  },
  { deep: true }
);

function startEdit() {
  syncDraftFromStore();
  isEditing.value = true;
}

async function saveChanges() {
  const base = authStore.user;
  if (!base) return;
  isSaving.value = true;
  try {
    const years =
      draft.workExperienceYears != null && !Number.isNaN(Number(draft.workExperienceYears))
        ? Number(draft.workExperienceYears)
        : undefined;
    const merged: AuthUserProfile = {
      ...base,
      ...draft,
      workExperienceYears: years,
    };
    authStore.setUser(merged);
    persistUserProfile(merged);
    await account.updateProfile({
      name: merged.name,
      phone: merged.phone,
    });
    isEditing.value = false;
  } finally {
    isSaving.value = false;
  }
}

const avatarInputRef = ref<HTMLInputElement | null>(null);
function pickAvatar() {
  avatarInputRef.value?.click();
}
function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    draft.avatarUrl = reader.result as string;
  };
  reader.readAsDataURL(file);
}

const normalizedPlanId = computed(() => (authStore.planId || 'free').toLowerCase());

const planLabels: Record<string, string> = {
  free: 'Free',
  master: 'Master',
  pro: 'PRO',
  corporate: 'Corporate',
  demo: 'Demo',
};

const planLabel = computed(
  () => planLabels[normalizedPlanId.value] || normalizedPlanId.value.toUpperCase()
);

const planExpiryLine = computed(() => {
  const iso =
    authStore.user?.planExpiresAt ||
    account.subscription.value?.periodEnd ||
    account.subscription.value?.trialEndsAt;
  if (!iso) return '';
  return `Действует до ${formatDate(iso)}`;
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const initials = computed(() => {
  const name = authStore.user?.name || authStore.user?.phone || '';
  return String(name).slice(0, 2).toUpperCase() || 'МС';
});

const workExperienceDisplay = computed(() => {
  const y = draft.workExperienceYears;
  if (y == null || Number.isNaN(Number(y))) return '';
  return `${y} лет`;
});

function onWorkExperienceInput(v: string) {
  const n = Number(v);
  draft.workExperienceYears = v === '' || Number.isNaN(n) ? undefined : n;
}

const showPasswordModal = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');

const canSavePassword = computed(
  () =>
    newPassword.value.length >= 6 && newPassword.value === confirmPassword.value
);

function closePasswordModal() {
  showPasswordModal.value = false;
  newPassword.value = '';
  confirmPassword.value = '';
  passwordError.value = '';
}

async function handlePasswordChange() {
  if (!canSavePassword.value) return;
  passwordError.value = '';
  try {
    closePasswordModal();
  } catch {
    passwordError.value = 'Ошибка при смене пароля';
  }
}

async function handleLogout() {
  const ok = confirm(
    'Выйти из аккаунта? Локальные данные сохранятся на устройстве.'
  );
  if (!ok) return;
  await authStore.logout();
  router.replace('/login');
}

function handleDeleteAccount() {
  const ok = confirm(
    'Удалить аккаунт? Все данные будут удалены. Это действие нельзя отменить.'
  );
  if (!ok) return;
  void authStore.logout().then(() => router.replace('/login'));
}
</script>

<style scoped>
.profile-screen {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 220;
}

.profile-screen__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}

.profile-screen__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}

.profile-screen__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.profile-screen__edit-btn,
.profile-screen__save-btn {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  padding: 0 4px;
}

.profile-screen__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 32px;
}

.profile-screen__hint {
  margin: 0 16px 8px;
  font-size: 12px;
  color: var(--dm-text-secondary);
  line-height: 1.4;
}

.profile-screen__hint-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--dm-accent);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.profile-screen__avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0 20px;
}

.profile-screen__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--dm-surface-2);
  border: 3px solid var(--dm-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: default;
}

.profile-screen__avatar:focus {
  outline: 2px solid var(--dm-accent);
  outline-offset: 2px;
}

.profile-screen__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-screen__avatar-initials {
  font-size: 28px;
  font-weight: 700;
  color: var(--dm-accent);
}

.profile-screen__avatar-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--dm-bg) 55%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.profile-screen__section {
  border-top: 1px solid var(--dm-border);
  padding: 4px 0;
}

.profile-screen__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 12px 16px 4px;
}

.profile-screen__plan-card {
  margin: 8px 16px;
  padding: 16px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 14px;
}

.profile-screen__plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.profile-screen__plan-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.profile-screen__plan-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.profile-screen__plan-badge--free {
  background: var(--dm-surface-2);
  color: var(--dm-text-secondary);
  border: 1px solid var(--dm-border);
}

.profile-screen__plan-badge--master {
  background: color-mix(in srgb, var(--dm-accent) 15%, transparent);
  color: var(--dm-accent);
}

.profile-screen__plan-badge--pro {
  background: color-mix(in srgb, var(--dm-text-primary) 12%, transparent);
  color: var(--dm-text-primary);
  border: 1px solid color-mix(in srgb, var(--dm-accent) 35%, transparent);
}

.profile-screen__plan-badge--corporate {
  background: color-mix(in srgb, var(--dm-warn) 15%, transparent);
  color: var(--dm-warn);
}

.profile-screen__plan-badge--demo {
  background: var(--dm-surface-2);
  color: var(--dm-accent);
}

.profile-screen__plan-expiry {
  font-size: 13px;
  color: var(--dm-text-secondary);
  margin-bottom: 12px;
}

.profile-screen__plan-upgrade {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.profile-screen__action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  min-height: 52px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: var(--dm-text-primary);
  box-sizing: border-box;
}

.profile-screen__action-chevron {
  color: var(--dm-text-secondary);
  font-size: 18px;
}

.profile-screen__danger-section {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 4px;
}

.profile-screen__logout-btn {
  min-height: 52px;
  background: transparent;
  border: 1px solid var(--dm-border);
  border-radius: 12px;
  color: var(--dm-text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.profile-screen__delete-btn {
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-danger);
  font-size: 14px;
  cursor: pointer;
}

.profile-screen__privacy-btn {
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.profile-screen__modal-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--dm-bg) 70%, transparent);
  z-index: 320;
  display: flex;
  align-items: flex-end;
  padding: 0;
}

.profile-screen__modal {
  width: 100%;
  background: var(--dm-surface);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.profile-screen__modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary);
  margin-bottom: 4px;
}

.profile-screen__modal-input {
  width: 100%;
  background: var(--dm-surface-2);
  border: 1px solid var(--dm-border);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: var(--dm-text-primary);
  outline: none;
  box-sizing: border-box;
}

.profile-screen__modal-input:focus {
  border-color: var(--dm-accent);
}

.profile-screen__modal-error {
  color: var(--dm-danger);
  font-size: 13px;
}

.profile-screen__modal-confirm {
  min-height: 52px;
  background: var(--dm-accent);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
}

.profile-screen__modal-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.profile-screen__modal-cancel {
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}
</style>
