<template>
  <div class="info-screen">
    <!-- Header -->
    <div class="app-header-logo-bar shrink-0">
      <div class="app-header-logo-bar__left">
        <button
          type="button"
          @click="$emit('home')"
          class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[40px] flex items-center gap-1"
        >
          <span>←</span>
          <span>Домой</span>
        </button>
      </div>
      <img
        src="/dm-small.png"
        alt="DentMetric"
        class="app-header-logo-bar__logo"
        onerror="this.style.display='none'"
      >
      <div class="app-header-logo-bar__right"></div>
    </div>

    <div class="flex items-center justify-center pb-3">
      <div class="px-5 py-1.5 rounded-full border border-white/10 bg-[#1a1a1a] shadow-lg">
        <span class="text-[10px] font-bold uppercase text-metric-green tracking-widest">Инструкция & FAQ</span>
      </div>
    </div>

    <!-- Sections -->
    <div class="info-screen__sections">

      <!-- 1. О приложении -->
      <InfoSection title="О приложении" icon="ℹ️" :default-open="true">
        <p class="info-text">
          DentMetric — профессиональный инструмент для расчёта стоимости
          кузовного ремонта методом PDR (беспокрасочное удаление вмятин).
        </p>
        <p class="info-text">
          Помогает быстро и точно оценить стоимость работ прямо на месте осмотра автомобиля.
        </p>
      </InfoSection>

      <!-- 2. Режимы расчёта -->
      <InfoSection title="Режимы расчёта" icon="⚡">
        <div class="info-mode-cards">
          <div class="info-mode-card">
            <div class="info-mode-card__header">
              <span class="info-mode-card__icon">⚡</span>
              <div>
                <div class="info-mode-card__title">Быстрый расчёт</div>
                <div class="info-mode-card__subtitle">Быстрая оценка на месте</div>
              </div>
            </div>
            <div class="info-mode-card__flow">
              <span v-for="(s, i) in quickFlow" :key="i" class="info-mode-card__step">
                <span class="info-mode-card__dot" />{{ s }}
              </span>
            </div>
            <div class="info-mode-card__when">
              <span class="info-mode-card__when-label">Когда:</span>
              Один клиент, нужен ответ за 2 минуты
            </div>
          </div>

          <div class="info-mode-card info-mode-card--highlighted">
            <div class="info-mode-card__header">
              <span class="info-mode-card__icon">📸</span>
              <div>
                <div class="info-mode-card__title">Детализация</div>
                <div class="info-mode-card__subtitle">Точная оценка с фото</div>
              </div>
            </div>
            <div class="info-mode-card__flow">
              <span v-for="(s, i) in detailFlow" :key="i" class="info-mode-card__step">
                <span class="info-mode-card__dot" />{{ s }}
              </span>
            </div>
            <div class="info-mode-card__when">
              <span class="info-mode-card__when-label">Когда:</span>
              Сложный случай, нужна документация
            </div>
          </div>
        </div>
      </InfoSection>

      <!-- 3. Быстрый расчёт: сценарий -->
      <InfoSection title="Быстрый расчёт" icon="⚡">
        <InfoSteps :steps="quickSteps" />
      </InfoSection>

      <!-- 4. Детализация: сценарий -->
      <InfoSection title="Детализация" icon="📸">
        <InfoSteps :steps="detailSteps" />
        <InfoNote
          type="tip"
          text="Снимайте строго перпендикулярно к повреждению — это влияет на точность разметки."
        />
      </InfoSection>

      <!-- 5. Клиент и история -->
      <InfoSection title="Клиент и история" icon="👤">
        <InfoSteps :steps="clientSteps" />
      </InfoSection>

      <!-- 6. Как читать итог -->
      <InfoSection title="Как читать итог" icon="📋">
        <div class="info-result-list">
          <div v-for="item in resultItems" :key="item.label" class="info-result-item">
            <div class="info-result-item__dot" />
            <div>
              <span class="info-result-item__label">{{ item.label }}</span>
              <span class="info-result-item__desc"> — {{ item.desc }}</span>
            </div>
          </div>
        </div>
        <InfoNote
          type="tip"
          text="Итог автоматически пересчитывается при изменении любого параметра. Вы можете скорректировать его вручную — это не изменит исходный расчёт, а добавит пометку «изменено»."
        />
      </InfoSection>

      <!-- 7. Советы и ошибки -->
      <InfoSection title="Советы и ошибки" icon="💡">
        <div class="info-tips-block">
          <div class="info-tips-block__title info-tips-block__title--good">Хорошие практики</div>
          <ul class="info-tips-block__list">
            <li v-for="t in tips" :key="t">{{ t }}</li>
          </ul>
        </div>
        <div class="info-tips-block">
          <div class="info-tips-block__title info-tips-block__title--warn">Частые ошибки</div>
          <div class="info-tips-block__errors">
            <InfoNote
              v-for="e in errors"
              :key="e.text"
              type="warning"
              :text="e.text"
            />
          </div>
        </div>
      </InfoSection>

      <!-- 8. FAQ -->
      <div class="info-faq">
        <h2 class="info-faq__title">Частые вопросы</h2>
        <InfoFaqItem
          v-for="item in faqItems"
          :key="item.q"
          :question="item.q"
          :answer="item.a"
        />
      </div>

      <!-- Disclaimer -->
      <div class="info-disclaimer">
        <div class="info-disclaimer__icon">⚠️</div>
        <div>
          <div class="info-disclaimer__label">Важно</div>
          <div class="info-disclaimer__text">
            Цена является ориентировочной. Окончательная стоимость может
            меняться после живого осмотра и дефектовки мастером.
          </div>
        </div>
      </div>

      <div style="height: 8px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoSection from './InfoSection.vue';
import InfoSteps from './InfoSteps.vue';
import InfoNote from './InfoNote.vue';
import InfoFaqItem from './InfoFaqItem.vue';

defineEmits<{
  (e: 'home'): void;
}>();

const quickFlow = ['Клиент', 'Повреждение', 'Параметры', 'Итог'];
const detailFlow = ['Клиент', 'Фото', 'Разметка', 'Размеры', 'Параметры', 'Итог'];

const quickSteps = [
  {
    title: 'Введите данные клиента',
    desc: 'Телефон, имя, автомобиль. Если клиент уже есть — приложение найдёт его автоматически.',
  },
  {
    title: 'Выберите повреждение',
    desc: 'Укажите расположение на кузове, форму и размеры вмятины.',
  },
  {
    title: 'Задайте параметры',
    desc: 'Сложность, условия работы, дополнительные факторы.',
  },
  {
    title: 'Получите итог',
    desc: 'Расчёт готов. Можно добавить скидку или изменить параметры.',
  },
  {
    title: 'Сохраните',
    desc: 'Расчёт остаётся в истории и доступен в любое время.',
  },
];

const detailSteps = [
  {
    title: 'Введите данные клиента',
    desc: 'Так же, как в быстром режиме.',
  },
  {
    title: 'Сделайте фото',
    desc: 'Снимайте строго перпендикулярно. Можно использовать камеру или выбрать из галереи.',
    tip: 'Хорошее фото — ровное, чёткое, без бликов. Повреждение должно занимать бо\u0301льшую часть кадра.',
  },
  {
    title: 'Разметьте повреждения',
    desc: 'Обведите каждую вмятину пальцем на фото. Вторичная деформация — отдельной кнопкой.',
  },
  {
    title: 'Введите размеры',
    desc: 'Для каждой вмятины — длина и ширина в мм. Все поля обязательны.',
    warning: 'Пока не введены все размеры — перейти дальше нельзя.',
  },
  {
    title: 'Задайте параметры',
    desc: 'Для каждой вмятины. Если параметры одинаковые — «Применить ко всем».',
  },
  {
    title: 'Получите итог',
    desc: 'Итог по каждой вмятине + общая сумма. Фото с разметкой прилагается.',
  },
  {
    title: 'Сохраните',
    desc: 'С фото, комментарием и способом оплаты.',
  },
];

const clientSteps = [
  {
    title: 'Поиск клиента',
    desc: 'При вводе телефона или имени — приложение ищет в истории. Если нашлось — «Подставить данные».',
  },
  {
    title: 'История',
    desc: 'Все расчёты в разделе «История». Фильтр по дате, статусу, клиенту.',
  },
  {
    title: 'Статусы',
    desc: '«Сохранено», «Записан», «Выполнено», «Отказ» — помогают вести журнал работ.',
  },
  {
    title: 'Редактирование',
    desc: 'Уже сохранённую запись можно редактировать: фото, скидка, итоговая сумма.',
  },
];

const resultItems = [
  { label: 'Базовая стоимость', desc: 'исходная цена для данного типа и размера вмятины.' },
  { label: 'Дополнительные факторы', desc: 'корректировки за сложность, тип материала, класс авто и доп. работы.' },
  { label: 'Скидка', desc: 'если применена, отображается отдельно.' },
  { label: 'Итог по вмятине', desc: 'финальная стоимость одной вмятины.' },
  { label: 'Итоговая сумма', desc: 'общая стоимость всех работ.' },
];

const tips = [
  'Снимайте фото сразу, пока клиент рядом.',
  'Вводите размеры точно — от этого зависит расчёт.',
  'Сохраняйте каждый расчёт, даже если клиент не подтвердил.',
  'Используйте «Применить ко всем» при одинаковых условиях работы.',
  'Добавляйте комментарий — он помогает при повторном обращении.',
];

const errors = [
  { text: 'Фото под углом — размеры на разметке будут неточными. Снимайте строго перпендикулярно к повреждению.' },
  { text: 'Не введены размеры — переход дальше заблокирован, пока не заполнены все поля.' },
  { text: 'Перепутан режим — для сложных многовмятинных работ лучше использовать Детализацию, а не Быстрый расчёт.' },
  { text: 'Не сохранён результат — все несохранённые расчёты теряются при закрытии приложения.' },
  { text: 'Скидка применена дважды — проверяйте скидки на уровне вмятины и на уровне заказа.' },
];

const faqItems = [
  {
    q: 'Что означают смайлики «адекватности клиента»?',
    a: 'Это ваша внутренняя пометка о коммуникации: удобно ли было работать с клиентом. На расчёт цены это не влияет, зато помогает при следующих визитах. В карточке клиента отображаются только эмодзи; пояснение всегда можно прочитать здесь, в «Инфо».',
  },
  {
    q: 'Что выбрать — Быстрый или Детализацию?',
    a: 'Быстрый расчёт — для оперативной оценки без фото. Детализация — для точного расчёта с фиксацией. Несколько сложных вмятин или нужна документация — выбирайте Детализацию.',
  },
  {
    q: 'Обязательно ли делать фото?',
    a: 'В Детализации — да, фото обязательно. В Быстром расчёте — не требуется.',
  },
  {
    q: 'Как исправить размер вмятины?',
    a: 'На экране ввода размеров — изменить до перехода дальше. После сохранения — через редактирование в Истории.',
  },
  {
    q: 'Как добавить несколько вмятин?',
    a: 'В обоих режимах можно добавить несколько. Каждая рассчитывается отдельно, итог суммируется.',
  },
  {
    q: 'Что такое вторичная деформация?',
    a: 'Дополнительная зона деформации рядом с основной вмятиной. Отмечается отдельно и учитывается при расчёте.',
  },
  {
    q: 'Почему итог меняется при изменении параметров?',
    a: 'Итог рассчитывается по всем введённым данным. При изменении любого — обновляется автоматически. Это нормально.',
  },
  {
    q: 'Как открыть старый расчёт?',
    a: 'Раздел «История» → найти запись по дате, клиенту или статусу → нажать.',
  },
  {
    q: 'Клиент уже был раньше — что делать?',
    a: 'Введите телефон — приложение найдёт его автоматически. Нажмите «Подставить данные».',
  },
  {
    q: 'Можно ли изменить итоговую стоимость?',
    a: 'Да, в карточке истории. Исходный расчёт сохраняется, в карточке появится пометка об изменении.',
  },
  {
    q: 'Как применить скидку?',
    a: 'На каждую вмятину отдельно или общую скидку на весь заказ — оба варианта доступны.',
  },
  {
    q: 'Что делать, если что-то работает неожиданно?',
    a: 'Проверьте, все ли обязательные поля заполнены. Если проблема повторяется — обратитесь в поддержку.',
  },
];
</script>

<style scoped>
.info-screen {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-screen__sections {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Generic text */
.info-text {
  font-size: 14px;
  color: var(--dm-text-secondary, #aaa);
  line-height: 1.6;
  margin: 0;
}

/* Mode comparison cards */
.info-mode-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-mode-card {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-mode-card--highlighted {
  border-color: rgba(136, 229, 35, 0.3);
}
.info-mode-card__header {
  display: flex;
  gap: 10px;
  align-items: center;
}
.info-mode-card__icon {
  font-size: 20px;
  line-height: 1;
}
.info-mode-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}
.info-mode-card__subtitle {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
}
.info-mode-card__flow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding-left: 2px;
}
.info-mode-card__step {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--dm-text-secondary, #aaa);
}
.info-mode-card__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dm-accent, #88e523);
  flex-shrink: 0;
}
.info-mode-card__when {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
  line-height: 1.4;
}
.info-mode-card__when-label {
  color: var(--dm-accent, #88e523);
  font-weight: 600;
}

/* Result guide */
.info-result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-result-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  color: var(--dm-text-secondary, #aaa);
  line-height: 1.5;
}
.info-result-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dm-accent, #88e523);
  flex-shrink: 0;
  margin-top: 7px;
}
.info-result-item__label {
  color: var(--dm-text-primary, #fff);
  font-weight: 600;
}

/* Tips block */
.info-tips-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-tips-block__title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.info-tips-block__title--good {
  color: var(--dm-accent, #88e523);
}
.info-tips-block__title--warn {
  color: #ffa000;
}
.info-tips-block__list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--dm-text-secondary, #aaa);
  line-height: 1.6;
  list-style: disc;
}
.info-tips-block__list li::marker {
  color: var(--dm-accent, #88e523);
}
.info-tips-block__errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* FAQ section */
.info-faq {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.info-faq__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
  margin: 0 0 4px;
}

/* Disclaimer */
.info-disclaimer {
  border: 1px solid rgba(229, 57, 53, 0.3);
  background: rgba(153, 27, 27, 0.1);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 4px;
}
.info-disclaimer__icon {
  font-size: 22px;
  line-height: 1;
  padding-top: 1px;
}
.info-disclaimer__label {
  color: var(--dm-danger, #e53935);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  margin-bottom: 2px;
}
.info-disclaimer__text {
  font-size: 13px;
  color: var(--dm-text-secondary, #ccc);
  line-height: 1.5;
}
</style>
