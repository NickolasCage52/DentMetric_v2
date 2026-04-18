<template>
  <div class="login-screen">
    <div class="login-screen__header">
      <div class="login-screen__logo">
        <span class="login-screen__logo-dm">DM</span>
        <span class="login-screen__logo-text">DentMetric</span>
      </div>
      <div class="login-screen__tagline">PDR Operating System</div>
    </div>

    <div v-if="step === 'phone'" class="login-screen__body">
      <div class="login-screen__title">Войти или зарегистрироваться</div>

      <div class="login-screen__field-wrap">
        <label class="login-screen__label">Номер телефона</label>
        <input
          ref="phoneInputRef"
          v-model="phone"
          type="tel"
          class="login-screen__input"
          placeholder="+7 900 000-00-00"
          inputmode="tel"
          @keydown.enter="handlePhoneSubmit"
        >
      </div>

      <button
        type="button"
        class="login-screen__primary-btn"
        :disabled="!isPhoneValid || isSending"
        @click="handlePhoneSubmit"
      >
        {{ isSending ? 'Отправка...' : 'Получить код' }}
      </button>

      <p class="login-screen__mock-hint" role="note">
        Демо-вход: после «Получить код» введите <strong>1234</strong>
      </p>

      <div class="login-screen__divider">
        <span>или</span>
      </div>

      <button
        type="button"
        class="login-screen__secondary-btn"
        @click="step = 'email'"
      >
        Войти с email и паролем
      </button>

      <div v-if="error" class="login-screen__error">{{ error }}</div>
    </div>

    <div v-else-if="step === 'otp'" class="login-screen__body">
      <button type="button" class="login-screen__back" @click="step = 'phone'">
        ← Назад
      </button>
      <div class="login-screen__title">Введите код</div>
      <div class="login-screen__subtitle">
        Код отправлен на {{ formattedPhone }}
      </div>

      <div class="login-screen__otp-row">
        <input
          v-for="(_, i) in 4"
          :key="i"
          :ref="(el) => setOtpRef(el, i)"
          v-model="otpDigits[i]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="login-screen__otp-box"
          @input="onOtpInput(i)"
          @keydown.backspace="onOtpBackspace(i)"
          @paste.prevent="onOtpPaste($event)"
        >
      </div>

      <p class="login-screen__mock-hint" role="note">
        Код подтверждения (демо): <strong>1234</strong>
      </p>

      <button
        type="button"
        class="login-screen__primary-btn"
        :disabled="otpValue.length < 4 || isVerifying"
        @click="handleOtpSubmit"
      >
        {{ isVerifying ? 'Проверка...' : 'Подтвердить' }}
      </button>

      <button
        type="button"
        class="login-screen__text-btn"
        :disabled="resendCooldown > 0"
        @click="handleResend"
      >
        {{
          resendCooldown > 0
            ? `Отправить снова (${resendCooldown}с)`
            : 'Отправить код ещё раз'
        }}
      </button>

      <div v-if="error" class="login-screen__error">{{ error }}</div>
    </div>

    <div v-else-if="step === 'email'" class="login-screen__body">
      <button type="button" class="login-screen__back" @click="step = 'phone'">
        ← Назад
      </button>
      <div class="login-screen__title">
        {{ emailMode === 'login' ? 'Вход' : 'Регистрация' }}
      </div>

      <div class="login-screen__field-wrap">
        <label class="login-screen__label">E-mail</label>
        <input
          v-model="email"
          type="email"
          class="login-screen__input"
          placeholder="example@mail.ru"
          inputmode="email"
          autocomplete="email"
        >
      </div>

      <div v-if="emailMode === 'register'" class="login-screen__field-wrap">
        <label class="login-screen__label">Имя (необязательно)</label>
        <input
          v-model="name"
          type="text"
          class="login-screen__input"
          placeholder="Как вас зовут"
        >
      </div>

      <div class="login-screen__field-wrap">
        <label class="login-screen__label">Пароль</label>
        <div class="login-screen__password-wrap">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="login-screen__input login-screen__input--password"
            placeholder="Минимум 6 символов"
            autocomplete="current-password"
            @keydown.enter="handleEmailSubmit"
          >
          <button
            type="button"
            class="login-screen__password-toggle"
            :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
            @click="showPassword = !showPassword"
          >
            <span class="login-screen__pwd-toggle-label">{{ showPassword ? 'скрыть' : 'показать' }}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="login-screen__primary-btn"
        :disabled="!isEmailValid || isVerifying"
        @click="handleEmailSubmit"
      >
        {{
          isVerifying
            ? 'Загрузка...'
            : emailMode === 'login'
              ? 'Войти'
              : 'Зарегистрироваться'
        }}
      </button>

      <button
        type="button"
        class="login-screen__text-btn"
        @click="emailMode = emailMode === 'login' ? 'register' : 'login'"
      >
        {{
          emailMode === 'login'
            ? 'Нет аккаунта? Зарегистрироваться'
            : 'Уже есть аккаунт? Войти'
        }}
      </button>

      <div v-if="error" class="login-screen__error">{{ error }}</div>
    </div>

    <div class="login-screen__privacy">
      Используя приложение, вы соглашаетесь с
      <a href="#" class="login-screen__link" @click.prevent>Политикой конфиденциальности</a>
      и
      <a href="#" class="login-screen__link" @click.prevent>Пользовательским соглашением</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAccount } from '@/modules/account/useAccount';
import {
  requestOtp,
  verifyOtp,
  loginWithEmail,
  registerWithEmail,
} from '@/services/authService';

const router = useRouter();
const authStore = useAuthStore();
const account = useAccount();
type Step = 'phone' | 'otp' | 'email';
type EmailMode = 'login' | 'register';

const step = ref<Step>('phone');
const emailMode = ref<EmailMode>('login');

const phone = ref('');
/** reactive-массив: стабильная привязка v-model к otpDigits[i] в v-for */
const otpDigits = reactive<string[]>(['', '', '', '']);
const otpInputRefs = ref<(HTMLInputElement | null)[]>([]);
const sessionId = ref('');
const isSending = ref(false);
const isVerifying = ref(false);
const resendCooldown = ref(0);
const phoneInputRef = ref<HTMLInputElement | null>(null);

const email = ref('');
const password = ref('');
const name = ref('');
const showPassword = ref(false);

const error = ref('');

const isPhoneValid = computed(() => phone.value.replace(/\D/g, '').length >= 10);

const isEmailValid = computed(
  () => email.value.includes('@') && password.value.length >= 6
);

const formattedPhone = computed(() => phone.value);

const otpValue = computed(() => otpDigits.join(''));

function setOtpRef(el: unknown, i: number) {
  if (el instanceof HTMLInputElement) {
    otpInputRefs.value[i] = el;
  }
}

onMounted(() => {
  phoneInputRef.value?.focus();
});

watch(step, (s) => {
  if (s === 'otp') {
    for (let i = 0; i < 4; i++) otpDigits[i] = '';
    nextTick(() => otpInputRefs.value[0]?.focus());
  }
  if (s === 'phone') {
    nextTick(() => phoneInputRef.value?.focus());
  }
});

async function handlePhoneSubmit() {
  if (!isPhoneValid.value || isSending.value) return;
  error.value = '';
  isSending.value = true;
  try {
    const result = await requestOtp(phone.value);
    if (result.success && result.sessionId) {
      sessionId.value = result.sessionId;
      step.value = 'otp';
      startResendCooldown();
    } else {
      error.value = result.error || 'Ошибка отправки кода';
    }
  } catch {
    error.value = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    isSending.value = false;
  }
}

function startResendCooldown() {
  resendCooldown.value = 60;
  const timer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) clearInterval(timer);
  }, 1000);
}

async function handleResend() {
  if (resendCooldown.value > 0) return;
  await handlePhoneSubmit();
}

function onOtpInput(index: number) {
  const v = otpDigits[index];
  if (v && v.length > 1) {
    otpDigits[index] = v.slice(-1);
  }
  if (otpDigits[index] && index < 3) {
    otpInputRefs.value[index + 1]?.focus();
  }
  if (otpValue.value.length === 4) {
    void nextTick(() => handleOtpSubmit());
  }
}

function onOtpBackspace(index: number) {
  if (!otpDigits[index] && index > 0) {
    otpDigits[index - 1] = '';
    otpInputRefs.value[index - 1]?.focus();
  }
}

function onOtpPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text').replace(/\D/g, '') || '';
  if (pasted.length >= 4) {
    for (let i = 0; i < 4; i++) {
      otpDigits[i] = pasted[i] || '';
    }
    otpInputRefs.value[3]?.focus();
    void nextTick(() => handleOtpSubmit());
  }
}

async function handleOtpSubmit() {
  if (otpValue.value.length < 4 || isVerifying.value) return;
  error.value = '';
  isVerifying.value = true;
  try {
    const result = await verifyOtp(phone.value, otpValue.value, sessionId.value);
    if (result.success && result.user && result.token) {
      authStore.setUser(result.user);
      account.applyAuthLogin(result.token, result.user);
      authStore.initialize();
      await nextTick();
      await router.replace('/');
    } else {
      error.value = result.error || 'Неверный код';
      for (let i = 0; i < 4; i++) otpDigits[i] = '';
      nextTick(() => otpInputRefs.value[0]?.focus());
    }
  } catch {
    error.value = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    isVerifying.value = false;
  }
}

async function handleEmailSubmit() {
  if (!isEmailValid.value || isVerifying.value) return;
  error.value = '';
  isVerifying.value = true;
  try {
    const result =
      emailMode.value === 'login'
        ? await loginWithEmail(email.value, password.value)
        : await registerWithEmail(email.value, password.value, name.value);

    if (result.success && result.user && result.token) {
      authStore.setUser(result.user);
      account.applyAuthLogin(result.token, result.user);
      await router.replace('/');
    } else {
      error.value = result.error || 'Ошибка входа';
    }
  } catch {
    error.value = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    isVerifying.value = false;
  }
}
</script>

<style scoped>
.login-screen {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 1;
}

.login-screen__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px 32px;
  flex-shrink: 0;
}
.login-screen__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.login-screen__logo-dm {
  font-size: 36px;
  font-weight: 900;
  color: var(--dm-accent);
  letter-spacing: -1px;
}
.login-screen__logo-text {
  font-size: 28px;
  font-weight: 800;
  color: var(--dm-text-primary);
  letter-spacing: -0.5px;
}
.login-screen__tagline {
  font-size: 13px;
  color: var(--dm-text-secondary);
  letter-spacing: 0.5px;
}

.login-screen__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px 24px;
  gap: 14px;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.login-screen__back {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.login-screen__title {
  font-size: 22px;
  font-weight: 800;
  color: var(--dm-text-primary);
  line-height: 1.2;
}
.login-screen__subtitle {
  font-size: 14px;
  color: var(--dm-text-secondary);
  margin-top: -8px;
}

.login-screen__field-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.login-screen__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.login-screen__input {
  width: 100%;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: var(--dm-text-primary);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  -webkit-appearance: none;
  appearance: none;
}
.login-screen__input:focus {
  border-color: var(--dm-accent);
}
.login-screen__password-wrap {
  position: relative;
}
.login-screen__input--password {
  padding-right: 48px;
}
.login-screen__password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
.login-screen__pwd-toggle-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--dm-accent);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.login-screen__otp-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 8px 0;
  flex-wrap: nowrap;
  max-width: 100%;
}
.login-screen__otp-box {
  width: 56px;
  height: 60px;
  flex: 0 0 auto;
  background: var(--dm-surface);
  border: 2px solid var(--dm-border);
  border-radius: 14px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--dm-text-primary);
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}
.login-screen__otp-box:focus {
  border-color: var(--dm-accent);
}

.login-screen__mock-hint {
  text-align: center;
  font-size: 12px;
  line-height: 1.4;
  color: var(--dm-text-secondary);
  background: var(--dm-surface-2);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0;
}
.login-screen__body > .login-screen__mock-hint {
  margin-top: 10px;
}

.login-screen__primary-btn {
  width: 100%;
  min-height: 52px;
  background: var(--dm-accent);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-bg);
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 4px;
}
.login-screen__primary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.login-screen__secondary-btn {
  width: 100%;
  min-height: 52px;
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--dm-text-primary);
  cursor: pointer;
}
.login-screen__text-btn {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  text-align: center;
}
.login-screen__text-btn:disabled {
  color: var(--dm-text-secondary);
  cursor: not-allowed;
}

.login-screen__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--dm-text-secondary);
  font-size: 13px;
}
.login-screen__divider::before,
.login-screen__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--dm-border);
}

.login-screen__error {
  color: var(--dm-danger);
  font-size: 13px;
  text-align: center;
  padding: 4px 0;
}

.login-screen__privacy {
  padding: 16px 24px max(32px, env(safe-area-inset-bottom));
  text-align: center;
  font-size: 11px;
  color: var(--dm-text-secondary);
  line-height: 1.6;
  flex-shrink: 0;
}
.login-screen__link {
  color: var(--dm-accent);
  text-decoration: none;
}
</style>
