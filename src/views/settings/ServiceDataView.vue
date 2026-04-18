<template>
  <div class="service-data">
    <div class="service-data__header">
      <button type="button" class="service-data__back" @click="$emit('back')">← Назад</button>
      <div class="service-data__title">Данные сервиса</div>
      <button type="button" class="service-data__save-btn" :disabled="isSaving" @click="handleSave">
        {{ isSaving ? '...' : 'Сохранить' }}
      </button>
    </div>

    <div class="service-data__content">
      <div class="service-data__logo-section">
        <div class="service-data__logo-preview" @click="pickLogo">
          <img v-if="form.logoBase64" :src="form.logoBase64" class="service-data__logo-img" alt="" />
          <div v-else class="service-data__logo-placeholder">
            <span>{{ glyphs.building }}</span>
            <span class="service-data__logo-hint">Загрузить логотип</span>
          </div>
        </div>
        <input
          ref="logoInputRef"
          type="file"
          accept="image/*"
          class="service-data__logo-input"
          @change="handleLogoChange"
        />
        <div class="service-data__logo-note">PNG или JPG, до 500 КБ. Будет показан в шапке документа.</div>
      </div>

      <div class="service-data__section-label">Организация</div>
      <ServiceDataField
        v-model="form.name"
        label="Название"
        placeholder="ИП Иванов Иван Иванович"
        :required="true"
      />
      <ServiceDataField v-model="form.shortName" label="Краткое название" placeholder="DentPro SPb" />
      <div class="service-data__field-row">
        <span class="service-data__field-label">Форма</span>
        <select v-model="form.legalForm" class="service-data__select">
          <option value="">Не указано</option>
          <option value="ИП">ИП</option>
          <option value="Самозанятый">Самозанятый</option>
          <option value="ООО">ООО</option>
          <option value="АО">АО</option>
        </select>
      </div>
      <ServiceDataField v-model="form.inn" label="ИНН" placeholder="123456789012" type="tel" />
      <ServiceDataField v-model="form.ogrn" label="ОГРН/ОГРНИП" placeholder="12345678901234" type="tel" />
      <ServiceDataField v-model="form.ofd" label="ОФД" placeholder="Название ОФД" />

      <div class="service-data__section-label">Контакты</div>
      <ServiceDataField v-model="form.address" label="Адрес" placeholder="г. Город, ул. Улица, д. 1" />
      <ServiceDataField v-model="form.city" label="Город" placeholder="Санкт-Петербург" />
      <ServiceDataField v-model="form.phone" label="Телефон" placeholder="+7 900 000-00-00" type="tel" />
      <ServiceDataField v-model="form.email" label="E-mail" placeholder="info@service.ru" type="email" />
      <ServiceDataField v-model="form.website" label="Сайт" placeholder="service.ru" />

      <div class="service-data__section-label">Настройки документа</div>
      <ServiceDataField v-model="form.documentTitle" label="Заголовок документа" placeholder="Заказ-наряд" />
      <ServiceDataField
        v-model="form.footerNote"
        label="Примечание внизу"
        placeholder="Гарантия 12 месяцев..."
        multiline
      />
      <div class="service-data__toggle-row">
        <span class="service-data__field-label">Строка подписи клиента</span>
        <label class="service-data__toggle">
          <input v-model="form.showSignatureLine" type="checkbox" />
          <span class="service-data__toggle-track" />
        </label>
      </div>

      <div class="service-data__notice">
        {{ glyphs.bulb }} Данные сервиса будут отображаться в шапке заказ-наряда
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useServiceDataStore } from '@/stores/serviceData';
import { normalizeServiceData, type ServiceData } from '@/types/serviceData';
import ServiceDataField from '@/components/settings/ServiceDataField.vue';

defineEmits<{ back: [] }>();

const glyphs = { building: '\u{1F3E2}', bulb: '\u{1F4A1}' };

const store = useServiceDataStore();
const isSaving = ref(false);
const logoInputRef = ref<HTMLInputElement | null>(null);

const form = reactive<ServiceData>(normalizeServiceData({}));

onMounted(() => {
  Object.assign(form, normalizeServiceData({ ...store.data }));
});

function pickLogo() {
  logoInputRef.value?.click();
}

function handleLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    alert('Файл слишком большой. Максимум 500 КБ.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.logoBase64 = reader.result as string;
  };
  reader.readAsDataURL(file);
}

async function handleSave() {
  isSaving.value = true;
  try {
    store.save({ ...form });
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.service-data {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 210;
}
.service-data__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.service-data__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.service-data__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.service-data__save-btn {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
}
.service-data__save-btn:disabled {
  opacity: 0.4;
}
.service-data__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 40px;
}
.service-data__logo-section {
  padding: 20px 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--dm-border);
}
.service-data__logo-preview {
  width: 120px;
  height: 80px;
  border: 2px dashed var(--dm-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}
.service-data__logo-preview:active {
  border-color: var(--dm-accent);
}
.service-data__logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.service-data__logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 24px;
}
.service-data__logo-hint {
  font-size: 11px;
  color: var(--dm-text-secondary);
}
.service-data__logo-input {
  display: none;
}
.service-data__logo-note {
  font-size: 11px;
  color: var(--dm-text-secondary);
  text-align: center;
  max-width: 260px;
}
.service-data__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 14px 16px 4px;
}
.service-data__field-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
}
.service-data__field-label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}
.service-data__select {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--dm-text-primary);
  font-size: 14px;
  text-align: right;
  outline: none;
  min-height: 44px;
  -webkit-appearance: none;
}
.service-data__select option {
  background: var(--dm-surface);
}
.service-data__toggle-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
}
.service-data__toggle {
  margin-left: auto;
  position: relative;
  width: 44px;
  height: 26px;
}
.service-data__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.service-data__toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: var(--dm-border);
  cursor: pointer;
  transition: background 0.2s;
}
.service-data__toggle input:checked + .service-data__toggle-track {
  background: var(--dm-accent);
}
.service-data__toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: hsl(0 0% 100%);
  transition: transform 0.2s;
}
.service-data__toggle input:checked + .service-data__toggle-track::after {
  transform: translateX(18px);
}
.service-data__notice {
  margin: 16px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--dm-accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dm-accent) 20%, transparent);
  border-radius: 10px;
  font-size: 13px;
  color: var(--dm-text-secondary);
  line-height: 1.5;
}
</style>
