import { ref, readonly } from 'vue';

const modalOpen = ref(false);
const modalConfig = ref({
  title: '',
  /** @type {Array<{ value: any, label: string, subtitle?: string, rightText?: string, disabled?: boolean }>} */
  options: [],
  /** @type {any} */
  value: null,
  /** @type {boolean} */
  multiple: false,
  /** @type {string} */
  confirmText: 'Готово'
});

let resolvePromise = null;

/**
 * Opens shared select modal (single or multi).
 * Resolves selected value (single) or array (multi) on "Готово",
 * or resolves with undefined on "Отмена".
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {Array<{ value: any, label: string, subtitle?: string, rightText?: string, disabled?: boolean }>} options.options
 * @param {any|any[]} options.value
 * @param {boolean} [options.multiple=false]
 * @param {string} [options.confirmText='Готово']
 * @returns {Promise<any|any[]|undefined>}
 */
export function openSelectModal(options = {}) {
  modalConfig.value = {
    title: options.title ?? '',
    options: Array.isArray(options.options) ? options.options : [],
    value: options.value ?? (options.multiple ? [] : null),
    multiple: options.multiple === true,
    confirmText: options.confirmText ?? 'Готово'
  };
  modalOpen.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

export function useSelectModal() {
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
    openSelectModal,
    confirm,
    cancel
  };
}

