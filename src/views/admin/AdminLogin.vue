<template>
  <div class="admin-login">
    <div class="admin-login__card" :class="{ shake: shaking }">
      <div class="admin-login__logo">DM</div>
      <div class="admin-login__title">DentMetric Admin</div>
      <div class="admin-login__subtitle">Введите пароль для доступа</div>

      <input
        v-model="password"
        type="password"
        class="admin-login__input"
        placeholder="Пароль"
        autocomplete="current-password"
        :disabled="isLoading"
        @keydown.enter="handleLogin"
      />

      <div v-if="error" class="admin-login__error">{{ error }}</div>

      <button
        type="button"
        class="admin-login__btn"
        :disabled="isLoading || !password"
        @click="handleLogin"
      >
        <span v-if="isLoading">Проверка...</span>
        <span v-else>Войти</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getApiBase, setAdminToken } from '@/services/adminApi'

const router = useRouter()
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const shaking = ref(false)

async function handleLogin() {
  if (!password.value || isLoading.value) return
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`${getApiBase()}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })

    if (response.ok) {
      const data = (await response.json()) as { token?: string }
      if (!data.token) throw new Error('No token')
      setAdminToken(data.token)
      await router.replace({ name: 'admin-dashboard' })
      return
    }

    const body = (await response.json().catch(() => ({}))) as {
      error?: string
    }
    if (
      response.status === 500 &&
      (body.error === 'Admin password not configured' ||
        body.error === 'Admin JWT not configured')
    ) {
      error.value =
        'Сервер не настроен для входа (ADMIN_PASSWORD / ADMIN_JWT_SECRET).'
    } else {
      error.value = 'Неверный пароль'
    }
    password.value = ''
    shaking.value = true
    setTimeout(() => {
      shaking.value = false
    }, 500)
  } catch {
    error.value = 'Нет соединения с сервером'
    password.value = ''
    shaking.value = true
    setTimeout(() => {
      shaking.value = false
    }, 500)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--dm-bg, #0f0f0f);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.admin-login__card {
  width: 100%;
  max-width: 360px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 20px;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.admin-login__card.shake {
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(6px);
  }
}
.admin-login__logo {
  font-size: 28px;
  font-weight: 900;
  color: var(--dm-accent, #a0e040);
  letter-spacing: -1px;
  margin-bottom: 4px;
}
.admin-login__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary, #ffffff);
}
.admin-login__subtitle {
  font-size: 13px;
  color: var(--dm-text-secondary, #888888);
  text-align: center;
  margin-bottom: 8px;
}
.admin-login__input {
  width: 100%;
  background: var(--dm-surface-2, #1e1e1e);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 15px;
  color: var(--dm-text-primary, #ffffff);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.admin-login__input:focus {
  border-color: var(--dm-accent, #a0e040);
}
.admin-login__error {
  font-size: 13px;
  color: var(--dm-danger, #e53935);
  align-self: flex-start;
}
.admin-login__btn {
  width: 100%;
  padding: 14px;
  background: var(--dm-accent, #a0e040);
  color: var(--metric-black, #000000);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  min-height: 48px;
  margin-top: 4px;
  transition: opacity 0.2s;
}
.admin-login__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
