import { ref, readonly } from 'vue';

const modalOpen = ref(false);
const modalConfig = ref({
  title: '',
  label: '',
  value: '',
  inputType: 'text',
  placeholder: '',
  helperText: '',
  min: null,
  max: null,
  step: null,
  allowDecimals: true
});

let resolvePromise = null;

/**
 * Opens the shared input modal. Returns a Promise that resolves with the new value on "Готово",
 * or resolves with undefined on "Отмена".
 * @param {Object} options - { title, label, value, inputType?, placeholder?, helperText?, min?, max?, step?, allowDecimals? }
 * @returns {Promise<string|number|undefined>}
 */
export function openInputModal(options = {}) {
  modalConfig.value = {
    title: options.title ?? '',
    label: options.label ?? '',
    value: options.value ?? '',
    inputType: options.inputType ?? 'text',
    placeholder: options.placeholder ?? '',
    helperText: options.helperText ?? '',
    min: options.min ?? null,
    max: options.max ?? null,
    step: options.step ?? null,
    allowDecimals: options.allowDecimals !== false,
    multiline: options.multiline === true,
    mask: options.mask ?? null,
    /** 'RU' | 'BY' — маска телефона в модалке (по умолчанию RU: +7) */
    phoneRegion: options.phoneRegion ?? null
  };
  modalOpen.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

export function useInputModal() {
  const confirm = (value) => {
    if (resolvePromise) resolvePromise(value);
    resolvePromise = null;
    modalOpen.value = false;
  };

  const cancel = () => {
    if (resolvePromise) resolvePromise(undefined);
    resolvePromise = null;
    modalOpen.value = false;
  };

  return {
    modalOpen: readonly(modalOpen),
    modalConfig: readonly(modalConfig),
    openInputModal,
    confirm,
    cancel
  };
}
