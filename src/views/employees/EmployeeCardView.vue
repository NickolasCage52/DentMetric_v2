<template>
  <div class="emp-card">
    <div class="emp-card__header">
      <button type="button" class="emp-card__back" @click="handleBack">← Назад</button>
      <div class="emp-card__title">Сотрудник</div>
      <button
        v-if="!isEditing && !isNewEmployee"
        type="button"
        class="emp-card__edit-btn"
        aria-label="Редактировать"
        @click="startEdit"
      >
        {{ '\u270F\uFE0F' }}
      </button>
      <button
        v-else-if="isEditing"
        type="button"
        class="emp-card__save-btn"
        :disabled="isSaving || !draft.name?.trim()"
        @click="saveEmployee"
      >
        {{ isSaving ? '...' : 'Сохранить' }}
      </button>
    </div>

    <div class="emp-card__scroll">
      <div class="emp-card__hero">
        <div
          class="emp-card__photo"
          :style="{ background: avatarColor(employee?.id || draft.id || 'new') }"
          role="button"
          tabindex="0"
          @click="isEditing && pickPhoto()"
          @keydown.enter.prevent="isEditing && pickPhoto()"
        >
          <img v-if="draft.photo" :src="draft.photo" alt="" class="emp-card__photo-img">
          <span v-else class="emp-card__photo-initials">{{ draftInitials }}</span>
          <div v-if="isEditing" class="emp-card__photo-overlay">Фото</div>
        </div>
        <input
          ref="photoInputRef"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handlePhotoChange"
        >

        <div class="emp-card__hero-name">
          <template v-if="isEditing">
            <input v-model="draft.name" class="emp-card__name-input" placeholder="Имя">
            <input
              v-model="draft.surname"
              class="emp-card__name-input emp-card__name-input--sm"
              placeholder="Фамилия (необязательно)"
            >
          </template>
          <template v-else>
            <div class="emp-card__name-display">{{ employee?.name }} {{ employee?.surname || '' }}</div>
            <div class="emp-card__role-display">{{ roleLabel(employee?.role || 'master') }}</div>
          </template>
        </div>
      </div>

      <EmployeeSection label="Основное">
        <EmployeeRow
          label="Стаж работы"
          :value="isEditing ? (draft.workExperienceYears ?? '') : workExperienceDisplay"
          :editing="isEditing"
          type="number"
          placeholder="Лет в профессии"
          @update="onWorkExperienceInput"
        />
        <EmployeeRow
          label="Должность"
          :value="draft.position"
          :editing="isEditing"
          placeholder="Мастер PDR"
          @update="draft.position = $event"
        />
        <EmployeeRow
          label="Категория"
          :value="draft.category"
          :editing="isEditing"
          placeholder="Основной персонал"
          @update="draft.category = $event"
        />
        <div class="emp-card__row">
          <span class="emp-card__row-label">Роль</span>
          <div v-if="isEditing" class="emp-card__role-toggle">
            <button
              type="button"
              :class="['emp-card__role-btn', draft.role === 'master' && 'emp-card__role-btn--active']"
              @click="draft.role = 'master'"
            >
              Мастер
            </button>
            <button
              type="button"
              :class="['emp-card__role-btn', draft.role === 'admin' && 'emp-card__role-btn--active']"
              @click="draft.role = 'admin'"
            >
              Администратор
            </button>
          </div>
          <span v-else class="emp-card__row-value">{{ roleLabel(draft.role) }}</span>
        </div>
        <div class="emp-card__row">
          <span class="emp-card__row-label">Статус</span>
          <label v-if="isEditing" class="emp-card__toggle">
            <input
              type="checkbox"
              :checked="draft.status === 'active'"
              @change="onStatusChange"
            >
            <span class="emp-card__toggle-track" />
          </label>
          <span
            v-else
            class="emp-card__row-value"
            :class="draft.status === 'active' ? 'emp-card__row-value--green' : ''"
          >
            {{ draft.status === 'active' ? 'Активен' : 'Неактивен' }}
          </span>
        </div>
      </EmployeeSection>

      <EmployeeSection label="Доступ к проекту">
        <div class="emp-card__row">
          <span class="emp-card__row-label">Пользователь</span>
          <label v-if="isEditing" class="emp-card__toggle">
            <input type="checkbox" :checked="hasLinkedAccount" @change="toggleAccess">
            <span class="emp-card__toggle-track" />
          </label>
          <span v-else class="emp-card__row-value">
            {{ draft.linkedAccountPhone ? draft.linkedAccountPhone : 'Не добавлен' }}
          </span>
        </div>
        <EmployeeRow
          v-if="isEditing || !!draft.linkedAccountPhone"
          label="Телефон аккаунта"
          :value="draft.linkedAccountPhone"
          :editing="isEditing"
          type="tel"
          placeholder="+7 900 000-00-00"
          @update="draft.linkedAccountPhone = $event || undefined"
        />
        <div v-if="isEditing" class="emp-card__hint">
          Сотрудник должен зарегистрироваться с этим номером, чтобы видеть записи этого сервиса
        </div>
      </EmployeeSection>

      <EmployeeSection label="Зарплата">
        <div class="emp-card__row">
          <span class="emp-card__row-label">Тип</span>
          <div v-if="isEditing" class="emp-card__role-toggle">
            <button
              type="button"
              :class="[
                'emp-card__role-btn',
                draft.salary.type === 'percent' && 'emp-card__role-btn--active',
              ]"
              @click="draft.salary.type = 'percent'"
            >
              % от работ
            </button>
            <button
              type="button"
              :class="[
                'emp-card__role-btn',
                draft.salary.type === 'fixed' && 'emp-card__role-btn--active',
              ]"
              @click="draft.salary.type = 'fixed'"
            >
              Фиксированная
            </button>
          </div>
          <span v-else class="emp-card__row-value">
            {{ draft.salary.type === 'percent' ? '% от работ' : 'Фиксированная' }}
          </span>
        </div>
        <EmployeeRow
          :label="draft.salary.type === 'percent' ? 'Процент' : 'Сумма'"
          :value="draft.salary.value?.toString()"
          :editing="isEditing"
          type="number"
          :placeholder="draft.salary.type === 'percent' ? '40' : '50000'"
          @update="draft.salary.value = Number($event)"
        >
          <template #suffix>
            <span class="emp-card__suffix">{{
              draft.salary.type === 'percent' ? '%' : 'руб.'
            }}</span>
          </template>
        </EmployeeRow>
      </EmployeeSection>

      <EmployeeSection label="График работы">
        <ScheduleEditor v-model="draft.schedule" :editing="isEditing" />
      </EmployeeSection>

      <EmployeeSection label="Услуги сотрудника">
        <div class="emp-card__services">
          <div v-for="(service, i) in draft.services" :key="i" class="emp-card__service-row">
            <span class="emp-card__service-name">{{ service }}</span>
            <button
              v-if="isEditing"
              type="button"
              class="emp-card__service-delete"
              aria-label="Удалить"
              @click="removeService(i)"
            >
              ×
            </button>
          </div>
          <div v-if="draft.services.length === 0" class="emp-card__service-empty">Нет услуг</div>
          <button v-if="isEditing" type="button" class="emp-card__add-service" @click="addService">
            + Добавить услугу
          </button>
        </div>
      </EmployeeSection>

      <EmployeeSection label="Оповещения">
        <NotificationToggleRow
          label="Новая запись"
          :value="draft.notifications.newBooking"
          :editing="isEditing"
          @update="draft.notifications.newBooking = $event"
        />
        <NotificationToggleRow
          label="Отмена записи"
          :value="draft.notifications.bookingCancelled"
          :editing="isEditing"
          @update="draft.notifications.bookingCancelled = $event"
        />
        <NotificationToggleRow
          label="Напоминание"
          :value="draft.notifications.reminder"
          :editing="isEditing"
          @update="draft.notifications.reminder = $event"
        />
      </EmployeeSection>

      <EmployeeSection label="Настройки онлайн записи">
        <NotificationToggleRow
          label="Виден в журнале"
          :value="draft.isVisibleInJournal"
          :editing="isEditing"
          @update="draft.isVisibleInJournal = $event"
        />
        <NotificationToggleRow
          label="Онлайн-запись"
          :value="draft.acceptsOnlineBooking"
          :editing="isEditing"
          @update="draft.acceptsOnlineBooking = $event"
        />
      </EmployeeSection>

      <EmployeeSection label="Контакты">
        <EmployeeRow
          label="Телефон"
          :value="draft.phone"
          :editing="isEditing"
          type="tel"
          placeholder="+7 900 000-00-00"
          @update="draft.phone = $event"
        />
        <EmployeeRow
          label="E-mail"
          :value="draft.email"
          :editing="isEditing"
          type="email"
          placeholder="master@mail.ru"
          @update="draft.email = $event"
        />
      </EmployeeSection>

      <div v-if="employeeId && !isNewEmployee" class="emp-card__danger">
        <button type="button" class="emp-card__delete-btn" @click="handleDelete">
          Удалить сотрудника
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, toRaw } from 'vue';
import { useEmployeesStore } from '@/stores/employees';
import { createDefaultEmployee, normalizeEmployee, type Employee } from '@/types/employee';
import EmployeeSection from '@/components/employees/EmployeeSection.vue';
import EmployeeRow from '@/components/employees/EmployeeRow.vue';
import ScheduleEditor from '@/components/employees/ScheduleEditor.vue';
import NotificationToggleRow from '@/components/employees/NotificationToggleRow.vue';

const props = defineProps<{
  employeeId?: string;
}>();

const emit = defineEmits<{
  back: [];
  saved: [id: string];
}>();

const store = useEmployeesStore();

const isNewEmployee = computed(() => !props.employeeId);
const isEditing = ref(false);
const isSaving = ref(false);
const photoInputRef = ref<HTMLInputElement | null>(null);

const employee = computed(() => (props.employeeId ? store.getById(props.employeeId) : null));

const draft = reactive<Employee>(normalizeEmployee({ ...createDefaultEmployee() }));

watch(
  () => props.employeeId,
  (id) => {
    if (id) {
      const e = store.getById(id);
      if (e) Object.assign(draft, normalizeEmployee({ ...(e as unknown as Record<string, unknown>) }));
      isEditing.value = false;
    } else {
      Object.assign(draft, normalizeEmployee({ ...createDefaultEmployee() }));
      isEditing.value = true;
    }
  },
  { immediate: true }
);

const draftInitials = computed(() => {
  const parts = [draft.name, draft.surname].filter(Boolean) as string[];
  return parts.map((p) => p[0].toUpperCase()).join('').slice(0, 2) || 'МС';
});

const workExperienceDisplay = computed(() => {
  const y = draft.workExperienceYears;
  if (y == null || Number.isNaN(Number(y))) return '';
  return `${y} лет`;
});

const hasLinkedAccount = computed(() => draft.linkedAccountPhone != null && draft.linkedAccountPhone !== '');

function roleLabel(role: string): string {
  return role === 'admin' ? 'Администратор' : 'Мастер';
}

function startEdit() {
  const e = employee.value;
  if (e) Object.assign(draft, normalizeEmployee({ ...(e as unknown as Record<string, unknown>) }));
  isEditing.value = true;
}

async function saveEmployee() {
  if (!draft.name?.trim()) return;
  isSaving.value = true;
  try {
    const raw = toRaw(draft);
    const normalized = normalizeEmployee({ ...(raw as unknown as Record<string, unknown>) });
    if (isNewEmployee.value) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...body } = normalized;
      const created = store.addEmployee(body);
      emit('saved', created.id);
    } else {
      store.updateEmployee(props.employeeId!, normalized);
      isEditing.value = false;
    }
  } finally {
    isSaving.value = false;
  }
}

function handleBack() {
  if (isEditing.value && !isNewEmployee.value) {
    isEditing.value = false;
    const e = employee.value;
    if (e) Object.assign(draft, normalizeEmployee({ ...(e as unknown as Record<string, unknown>) }));
  } else {
    emit('back');
  }
}

function pickPhoto() {
  photoInputRef.value?.click();
}

function handlePhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    draft.photo = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function addService() {
  const name = window.prompt('Название услуги:');
  if (name?.trim()) draft.services.push(name.trim());
}

function removeService(i: number) {
  draft.services.splice(i, 1);
}

function toggleAccess(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (!checked) draft.linkedAccountPhone = undefined;
  else draft.linkedAccountPhone = '';
}

function onStatusChange(e: Event) {
  draft.status = (e.target as HTMLInputElement).checked ? 'active' : 'inactive';
}

function onWorkExperienceInput(v: string) {
  const n = Number(v);
  draft.workExperienceYears = v === '' || Number.isNaN(n) ? undefined : n;
}

function handleDelete() {
  const ok = confirm(`Удалить сотрудника ${draft.name}? Это действие нельзя отменить.`);
  if (!ok) return;
  store.deleteEmployee(props.employeeId!);
  emit('back');
}

const HUES = [220, 340, 45, 160, 270, 195, 25, 85];

function avatarColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = HUES[Math.abs(hash) % HUES.length];
  return `hsl(${hue} 55% 42%)`;
}
</script>

<style scoped>
.emp-card {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 220;
}

.emp-card__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}

.emp-card__back,
.emp-card__edit-btn,
.emp-card__save-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  min-height: 44px;
  padding: 0 4px;
}

.emp-card__back {
  color: var(--dm-text-secondary);
  font-size: 14px;
  min-width: 44px;
}

.emp-card__edit-btn {
  font-size: 18px;
  line-height: 1;
}

.emp-card__save-btn {
  color: var(--dm-accent);
  font-size: 14px;
  font-weight: 600;
}

.emp-card__save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.emp-card__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-card__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 32px;
}

.emp-card__hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px 16px;
  border-bottom: 1px solid var(--dm-border);
}

.emp-card__photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.emp-card__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.emp-card__photo-initials {
  font-size: 24px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-card__photo-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--dm-bg) 55%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-primary);
}

.emp-card__hero-name {
  flex: 1;
  min-width: 0;
}

.emp-card__name-display {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.emp-card__role-display {
  font-size: 13px;
  color: var(--dm-text-secondary);
  margin-top: 4px;
}

.emp-card__name-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 17px;
  font-weight: 700;
  outline: none;
  padding: 4px 0;
  min-height: 44px;
  box-sizing: border-box;
}

.emp-card__name-input--sm {
  font-size: 14px;
  font-weight: 400;
  margin-top: 6px;
}

.emp-card__row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
  box-sizing: border-box;
}

.emp-card__row-label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  flex-shrink: 0;
  min-width: 120px;
}

.emp-card__row-value {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-primary);
  text-align: right;
}

.emp-card__row-value--green {
  color: var(--dm-accent);
}

.emp-card__suffix {
  font-size: 14px;
  color: var(--dm-text-secondary);
  flex-shrink: 0;
}

.emp-card__role-toggle {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.emp-card__role-btn {
  padding: 6px 12px;
  border: 1px solid var(--dm-border);
  border-radius: 20px;
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 12px;
  cursor: pointer;
  min-height: 44px;
}

.emp-card__role-btn--active {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
  background: color-mix(in srgb, var(--dm-accent) 10%, transparent);
}

.emp-card__toggle {
  margin-left: auto;
  position: relative;
  width: 44px;
  height: 26px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.emp-card__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.emp-card__toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: var(--dm-border);
  transition: background 0.2s;
  cursor: pointer;
}

.emp-card__toggle input:checked + .emp-card__toggle-track {
  background: var(--dm-accent);
}

.emp-card__toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--dm-text-primary);
  transition: transform 0.2s;
}

.emp-card__toggle input:checked + .emp-card__toggle-track::after {
  transform: translateX(18px);
}

.emp-card__services {
  padding: 8px 16px;
}

.emp-card__service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--dm-border);
  min-height: 44px;
  gap: 8px;
}

.emp-card__service-name {
  font-size: 14px;
  color: var(--dm-text-primary);
  word-break: break-word;
}

.emp-card__service-delete {
  background: transparent;
  border: none;
  color: var(--dm-danger);
  font-size: 16px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

.emp-card__service-empty {
  font-size: 13px;
  color: var(--dm-text-secondary);
  padding: 8px 0;
}

.emp-card__add-service {
  margin-top: 8px;
  background: transparent;
  border: 1px dashed var(--dm-border);
  border-radius: 10px;
  color: var(--dm-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 16px;
  width: 100%;
  min-height: 44px;
}

.emp-card__hint {
  padding: 8px 16px 12px;
  font-size: 12px;
  color: var(--dm-text-secondary);
  line-height: 1.5;
}

.emp-card__danger {
  padding: 24px 16px 16px;
  display: flex;
  justify-content: center;
}

.emp-card__delete-btn {
  background: transparent;
  border: none;
  color: var(--dm-danger);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
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
</style>
