<template>
  <div ref="appRootRef" class="app-root max-w-md mx-auto relative min-h-[100dvh] h-screen flex flex-col text-white overflow-x-hidden pb-[env(safe-area-inset-bottom)]" :class="{ 'app-root--gradient': currentSection === 'home', 'app-root--solid': currentSection !== 'home' }">
    <!-- Home: shared shell for identical layout with Mode selection -->
    <WowScreenShell
      v-if="currentSection === 'home'"
      :show-background="true"
      :show-profile-button="true"
      @profile-click="onProfileClick"
    >
      <div class="wow-tile-grid wow-screen-shell__tiles">
          <button
            data-testid="btn-open-metric"
            @click="openMetricMenu"
            class="wow-tile home-btn home-btn-primary"
          >
            <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider">Метрика</span>
            <span class="text-[10px] text-gray-500">Расчёт стоимости</span>
          </button>
          <button
            type="button"
            class="wow-tile home-btn home-btn-disabled"
            disabled
            aria-disabled="true"
            aria-label="Аналитика — в разработке"
          >
            <svg class="home-btn-icon w-8 h-8 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider text-gray-500">Аналитика</span>
            <span class="text-[10px] text-gray-600 flex items-center gap-1 justify-center"><span>Доступно в Pro</span><svg class="w-3.5 h-3.5 shrink-0 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></span>
          </button>
          <button
            data-testid="btn-history"
            @click="goToHistory"
            class="wow-tile home-btn home-btn-primary"
          >
            <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider">История оценок</span>
            <span class="text-[10px] text-gray-500">Сохранённые расчёты</span>
          </button>
          <button
            type="button"
            class="wow-tile home-btn home-btn-disabled"
            disabled
            aria-disabled="true"
            aria-label="Журнал записи — в разработке"
          >
            <svg class="home-btn-icon w-8 h-8 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider text-gray-500">Журнал записи</span>
            <span class="text-[10px] text-gray-600 flex items-center gap-1 justify-center"><span>Доступно в Pro</span><svg class="w-3.5 h-3.5 shrink-0 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></span>
          </button>
        </div>
    </WowScreenShell>

    <!-- Section: Metric -->
    <div v-else-if="currentSection === 'metric'" class="flex flex-col h-full">
      <!-- Mode selection: same shell as Home for identical layout -->
      <WowScreenShell
        v-if="!calcMode"
        :show-background="true"
        :show-profile-button="true"
        :has-subtitle="true"
        @profile-click="onProfileClick"
      >
        <template #subtitle>
          <h2 class="text-metric-green text-xs font-bold uppercase tracking-[0.2em]">ВЫБОР РЕЖИМА РАСЧЁТА</h2>
        </template>
        <div class="wow-tile-grid wow-screen-shell__tiles">
            <button
              data-testid="btn-quick-mode"
              @click="selectMetricMode('standard')"
              class="wow-tile home-btn home-btn-primary"
            >
              <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span class="text-sm font-bold uppercase tracking-wider">Быстрый</span>
              <span class="text-[10px] text-gray-500">Короткий расчёт</span>
            </button>
            <button
              data-testid="btn-detail-mode"
              @click="selectMetricMode('graphics')"
              class="wow-tile home-btn home-btn-primary"
            >
              <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span class="text-sm font-bold uppercase tracking-wider">Детализация</span>
              <span class="text-[10px] text-gray-500">Графический режим</span>
            </button>
            <button
              type="button"
              class="wow-tile home-btn home-btn-disabled"
              disabled
              aria-disabled="true"
              aria-label="Град — в разработке"
            >
              <svg class="home-btn-icon w-8 h-8 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm font-bold uppercase tracking-wider text-gray-500">Град</span>
              <span class="text-[10px] text-gray-600 flex items-center gap-1"><svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> В разработке</span>
            </button>
            <div class="wow-tile-empty" aria-hidden="true"></div>
          </div>
      </WowScreenShell>

      <template v-else>
      <div v-if="calcMode !== 'graphics'" class="shrink-0 z-20 bg-black px-4" :class="(calcMode === 'standard' && (quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick))) ? 'pt-2 pb-1' : 'pt-4 pb-0 space-y-3'">
        <div class="app-header-logo-bar" :class="(calcMode === 'standard' && (quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick))) ? '' : 'pb-2'">
          <div class="app-header-logo-bar__left"></div>
          <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo drop-shadow-2xl" onerror="this.style.display='none'">
          <div class="app-header-logo-bar__right"></div>
        </div>
      </div>

      <div
        ref="metricScrollRef"
        class="flex-1 overflow-y-auto p-4 pt-0"
        :style="{ paddingBottom: metricScrollPaddingBottom }"
        :class="{ 'overflow-hidden h-0': calcMode === 'graphics' }"
      >
        <!-- Standard mode -->
        <div v-if="calcMode === 'standard'" class="flex flex-col min-h-full">
          <div data-testid="step-dots" class="flex items-center justify-center" :class="(quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick)) ? 'pb-1' : 'pb-2'">
            <StepDots :current-step="quickLogicalStep" :total-steps="quickTotalSteps" />
          </div>

          <div :class="(quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick)) ? 'space-y-0 pb-4' : (quickStep === 3 ? 'pb-20' : 'space-y-4 pb-40')">
            <div v-if="quickStep === 1 && userSettings.showClientQuick" class="space-y-3">
              <div class="card-metallic rounded-2xl p-5 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">ДАННЫЕ КЛИЕНТА</span>
                    <InfoIcon v-if="userSettings.showInfoTooltips" tooltip-text="Заполните контактные данные клиента и информацию об автомобиле. Эти поля можно сделать обязательными в настройках." />
                    <span v-if="userSettings.clientRequired" class="text-[10px] text-red-400 uppercase tracking-widest">обязательно</span>
                    <span v-else class="text-[10px] text-gray-500">опционально</span>
                  </div>
                  <button
                    type="button"
                    class="client-reset-btn"
                    @click="resetClientDataOnly"
                    aria-label="Сбросить данные клиента и автомобиля, кроме даты и времени"
                  >
                    СБРОС
                  </button>
                </div>
                <div class="grid grid-cols-1 gap-2">
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('clientName', 'Имя клиента', 'text', 'Имя клиента')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.clientName ? 'text-white' : 'text-gray-400'">{{ estimateDraft.clientName || 'Имя клиента' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('clientPhone', 'Телефон', 'tel', 'Телефон')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.clientPhone ? 'text-white' : 'text-gray-400'">{{ estimateDraft.clientPhone || 'Телефон' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                  <ClientFoundCard
                    v-if="requireFeature('historyEnabled')"
                    :client="foundClient"
                    @open-history="openClientHistory"
                    @autofill-client="handleAutofillClient"
                  />
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('clientCompany', 'Компания (необязательно)', 'text', 'Компания')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.clientCompany ? 'text-white' : 'text-gray-400'">{{ estimateDraft.clientCompany || 'Компания (необязательно)' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                </div>
              </div>
              <div class="card-metallic rounded-2xl p-5 space-y-3">
                <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">АВТОМОБИЛЬ</div>
                <div class="grid grid-cols-1 gap-2">
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('carBrand', 'Марка автомобиля', 'text', 'Марка')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.carBrand ? 'text-white' : 'text-gray-400'">{{ estimateDraft.carBrand || 'Марка' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('carModel', 'Модель автомобиля', 'text', 'Модель')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.carModel ? 'text-white' : 'text-gray-400'">{{ estimateDraft.carModel || 'Модель' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('carPlate', 'Гос.номер', 'text', 'Гос.номер')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.carPlate ? 'text-white' : 'text-gray-400'">{{ estimateDraft.carPlate || 'Гос.номер' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                </div>
              </div>
              <div class="card-metallic rounded-2xl p-5 space-y-3">
                <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ДАТА И ВРЕМЯ</div>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('inspectDate', 'Дата осмотра', 'date', 'Дата')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.inspectDate ? 'text-white' : 'text-gray-400'">{{ estimateDraft.inspectDate || 'Дата' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                  <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openClientField('inspectTime', 'Время осмотра', 'time', 'Время')">
                    <span class="truncate text-[12px] font-semibold" :class="estimateDraft.inspectTime ? 'text-white' : 'text-gray-400'">{{ estimateDraft.inspectTime || 'Время' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
                  </button>
                </div>
                <p v-if="userSettings.clientRequired && !clientDataValid" class="text-[10px] text-gray-500 text-center">Заполните обязательные поля</p>
              </div>
            </div>

            <div v-else-if="quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick)" data-testid="quick-step2" class="qc-compact" style="display:flex;flex-direction:column;gap:var(--qc-section-gap)">
              <div class="mb-2 flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ПОВРЕЖДЕНИЯ</div>
                  <div class="flex gap-1.5 flex-wrap items-center">
                    <button
                      v-for="(d, i) in estimateDraft.quickDents"
                      :key="d.id"
                      type="button"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation"
                      :class="activeQuickDentId === d.id ? 'bg-metric-green text-black' : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white border border-white/10'"
                      @click="setActiveQuickDent(d.id)"
                    >
                      Вмятина {{ i + 1 }}
                    </button>
                    <button
                      v-if="estimateDraft.quickDents.length > 1"
                      type="button"
                      data-testid="quick-remove-dent"
                      class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all touch-manipulation"
                      aria-label="Удалить повреждение"
                      @click="removeActiveQuickDent"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    class="client-reset-btn qc-reset-btn"
                    data-testid="quick-reset-dents"
                    @click="resetQuickDentsValues"
                    aria-label="Сбросить введённые значения"
                  >
                    СБРОС
                  </button>
                  <button
                    type="button"
                    data-testid="quick-add-dent"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-metric-green/20 text-metric-green border border-metric-green/40 hover:bg-metric-green/30 transition-all touch-manipulation"
                    aria-label="Добавить повреждение"
                    @click="addQuickDent(); nextTick(() => metricScrollRef?.value?.scrollTo?.({ top: 0, behavior: 'smooth' }))"
                  >
                    +
                  </button>
                </div>
              </div>
              <div v-if="!activeQuickDent" class="card-metallic rounded-2xl p-5 text-center text-gray-400">
                Повреждение не выбрано
              </div>
              <template v-else>
                <!-- 1. СТОРОНА АВТОМОБИЛЯ (ЛЕВАЯ | ВЕРХ | ПРАВАЯ) -->
                <div style="padding:0 2px">
                  <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">СТОРОНА АВТОМОБИЛЯ</div>
                  <SegmentedControl
                    :model-value="activeQuickDent.panelSide"
                    :options="[{ value: 'left', label: 'ЛЕВАЯ' }, { value: 'top', label: 'ВЕРХ' }, { value: 'right', label: 'ПРАВАЯ' }]"
                    @update:modelValue="setQuickDentSide(activeQuickDent, $event)"
                  />
                </div>

                <!-- 2. ПОВРЕЖДЕННЫЙ ЭЛЕМЕНТ -->
                <div style="padding:0 2px">
                  <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ПОВРЕЖДЕННЫЙ ЭЛЕМЕНТ</div>
                  <button
                    type="button"
                    data-testid="quick-panel-element"
                    class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                    :class="activeQuickDent.panelElement ? 'bg-[#1a1a1a] border-white/15 text-white' : 'bg-[#151515] border-white/10 text-gray-200 hover:border-white/15'"
                    @click="openQuickPanelElementPicker(activeQuickDent)"
                  >
                    <span class="qc-sr-value text-[13px] font-semibold truncate">{{ activeQuickDent.panelElement || 'Выбрать элемент' }}</span>
                    <div class="shrink-0 flex items-center gap-1.5">
                      <svg v-if="activeQuickDent.panelElement" class="w-4 h-4 text-metric-green/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="getElementIconPath(activeQuickDent.panelElement)" /></svg>
                      <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                </div>

                <!-- 3. ГЕОМЕТРИЯ ПОВРЕЖДЕНИЯ -->
                <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">ГЕОМЕТРИЯ ПОВРЕЖДЕНИЯ</span>
                    <button type="button" class="qc-preset-chip" data-testid="quick-presets" @click="presetsModalOpen = true">ПРЕСЕТЫ</button>
                  </div>
                  <div class="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      class="qc-geo-btn border transition-colors touch-manipulation text-left"
                      :class="(Number(activeQuickDent.sizeLengthMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="activeQuickDent.sizeInputMode = 'manual'; openQuickDentSizeModal(activeQuickDent, 'sizeLengthMm', 'Длина (мм)')"
                    >
                      <div class="qc-geo-label">длина</div>
                      <div class="qc-geo-value" :class="(Number(activeQuickDent.sizeLengthMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
                        {{ (Number(activeQuickDent.sizeLengthMm) || 0) > 0 ? Number(activeQuickDent.sizeLengthMm).toFixed(0) + 'мм' : '—' }}
                      </div>
                    </button>
                    <button
                      type="button"
                      class="qc-geo-btn border transition-colors touch-manipulation text-left"
                      :class="(Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="activeQuickDent.sizeInputMode = 'manual'; openQuickDentSizeModal(activeQuickDent, 'sizeWidthMm', 'Высота (мм)')"
                    >
                      <div class="qc-geo-label">ширина</div>
                      <div class="qc-geo-value" :class="(Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
                        {{ (Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? Number(activeQuickDent.sizeWidthMm).toFixed(0) + 'мм' : '—' }}
                      </div>
                    </button>
                  </div>
                  <div class="qc-info-rows">
                    <div>Площадь: <span>{{ (Number(activeQuickDent.sizeLengthMm) || 0) > 0 && (Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? ((Number(activeQuickDent.sizeLengthMm) || 0) * (Number(activeQuickDent.sizeWidthMm) || 0)).toFixed(1) : '—' }}</span></div>
                    <div>Соотношение сторон: <span>{{ (Number(activeQuickDent.sizeLengthMm) || 0) > 0 && (Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? (Math.max(Number(activeQuickDent.sizeLengthMm), Number(activeQuickDent.sizeWidthMm)) / Math.min(Number(activeQuickDent.sizeLengthMm), Number(activeQuickDent.sizeWidthMm))).toFixed(1) : '—' }}</span></div>
                    <div>Тип формы: <span>{{ (Number(activeQuickDent.sizeLengthMm) || 0) > 0 && (Number(activeQuickDent.sizeWidthMm) || 0) > 0 ? getQuickDetectedShapeLabel(activeQuickDent) : '—' }}</span></div>
                  </div>
                </div>

                <!-- 4. ПАРАМЕТРЫ РАСЧЁТА -->
                <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
                  <div class="qc-section-title text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">ПАРАМЕТРЫ РАСЧЁТА</div>
                  <div style="display:flex;flex-direction:column;gap:4px">
                    <button
                      type="button"
                      data-testid="quick-param-repair"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent.conditions?.repairCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickParamPicker(activeQuickDent, 'repairCode', 'Технология ремонта', initialData.repairTypes)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent.conditions?.repairCode ? 'text-white' : 'text-gray-400'">{{ getRepairLabel(activeQuickDent.conditions?.repairCode) || 'Метод ремонта' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent.conditions?.repairCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-testid="quick-param-risk"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent.conditions?.riskCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickParamPicker(activeQuickDent, 'riskCode', 'Сложность выполнения', initialData.risks)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent.conditions?.riskCode ? 'text-white' : 'text-gray-400'">{{ getRiskLabel(activeQuickDent.conditions?.riskCode) || 'Сложность выполнения' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent.conditions?.riskCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-testid="quick-param-material"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent.conditions?.materialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickParamPicker(activeQuickDent, 'materialCode', 'Материал панели', initialData.materials)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent.conditions?.materialCode ? 'text-white' : 'text-gray-400'">{{ getMaterialLabel(activeQuickDent.conditions?.materialCode) || 'Материал панели' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent.conditions?.materialCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-testid="quick-param-carclass"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent.conditions?.carClassCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickParamPicker(activeQuickDent, 'carClassCode', 'Класс автомобиля', initialData.carClasses)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent.conditions?.carClassCode ? 'text-white' : 'text-gray-400'">{{ getCarClassLabel(activeQuickDent.conditions?.carClassCode) || 'Класс автомобиля' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent.conditions?.carClassCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- 5. ДОПОЛНИТЕЛЬНО -->
                <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
                  <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ДОПОЛНИТЕЛЬНО…</div>
                  <div style="display:flex;flex-direction:column;gap:4px">
                    <button
                      type="button"
                      data-testid="quick-armaturnaya"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="(activeQuickDent.conditions?.disassemblyCodes?.length ?? 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickArmaturnayaPicker(activeQuickDent)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="(activeQuickDent.conditions?.disassemblyCodes?.length ?? 0) > 0 ? 'text-white' : 'text-gray-400'">{{ formatArmaturnayaSummary(activeQuickDent.conditions?.disassemblyCodes, activeQuickDent.panelElement) || 'Арматурные работы' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    <button
                      v-if="userSettings.showPaintMaterial"
                      type="button"
                      data-testid="quick-param-paint"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent.conditions?.paintMaterialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickPaintPicker(activeQuickDent)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent.conditions?.paintMaterialCode ? 'text-white' : 'text-gray-400'">{{ getPaintMaterialLabel(activeQuickDent.conditions?.paintMaterialCode) || 'Материал ЛКП' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent.conditions?.paintMaterialCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    <button
                      v-if="userSettings.showSoundInsulation"
                      type="button"
                      class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
                      :class="activeQuickDent?.conditions?.soundInsulationCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                      @click="openQuickSoundPicker(activeQuickDent)"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeQuickDent?.conditions?.soundInsulationCode ? 'text-white' : 'text-gray-400'">{{ getSoundInsulationLabel(activeQuickDent?.conditions?.soundInsulationCode) || 'Шумоизоляция' }}</div>
                      </div>
                      <div class="shrink-0 flex items-center gap-1.5">
                        <div v-if="activeQuickDent?.conditions?.soundInsulationCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
                        <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                  </div>
                </div>

              </template>
            </div>

            <div v-else-if="quickStep === 3" class="qc-step3 qc-step3--tabbed flex flex-col min-h-0 flex-1">
              <ClientInfoBlock
                :client="quickClientForDisplay"
                :editable="true"
                @edit="onQuickStep3EditClient"
                @edit-field="onQuickStep3EditClientField"
              />
              <StandardQuickFinalScreen
                class="min-h-0 flex-1"
                :draft="estimateDraft"
                :engine-line-items="quickLineItems"
                :client-display="quickClientForDisplay"
                :user-settings="userSettings"
                :build-detailed-breakdown="buildDetailedBreakdown"
                :engine-dents-total="quickDmDentSubtotal"
                @open-discount="openDiscountModal"
                @open-comment="openCommentModal"
              />
            </div>
          </div>
        </div>

        <!-- Time mode (locked) -->
        <div v-if="calcMode === 'time'" class="space-y-4">
          <div class="card-metallic rounded-2xl p-5 text-center text-gray-400">
            <div class="text-lg mb-2">🔒</div>
            <div class="text-sm">Раздел в разработке</div>
          </div>
        </div>

        <!-- Graphics mode: wizard из 4 шагов -->
      <GraphicsWizard
          ref="graphicsWizardRef"
          v-if="calcMode === 'graphics'"
          v-model:selected-class-id="graphicsSelectedClassId"
          v-model:selected-part-id="graphicsSelectedPartId"
          :form="form"
          :conditions-for-calc="graphicsConditions"
          :initial-data="initialData"
          :user-settings="userSettings"
          :car-classes="graphicsData.carClasses"
          :parts-list="graphicsPartsList"
          :selected-part="graphicsState.selectedPart"
          :circle-sizes="graphicsCircleSizes"
          :strip-sizes="graphicsStripSizes"
        :use-quick-ui-in-detail="userSettings.useQuickUiInDetail !== false"
        :estimate-draft="estimateDraft"
        :history-saving="isSavingHistory"
          :client-required="userSettings.clientRequired"
          :client-valid="clientDataValid"
          :show-client-step="userSettings.showClientDetail"
          :auto-save="userSettings.autoSaveHistory"
        @home="goHome"
          @close="closeEditor"
          @dents-change="(d) => graphicsState.dents = d"
        @save-history="(e) => saveCurrentEstimate('detail', e?.lineItems)"
        @book-history="(e) => saveAndBookEstimate('detail', e?.lineItems)"
        :history-enabled="requireFeature('historyEnabled')"
        @open-record="openRecordFromSheet"
        @open-client-history="navigateToHistoryByClientPhone"
        />
      </div>

      <!-- Панель Назад/Вперёд быстрого расчёта — вне скролла, всегда видна внизу -->
      <div
        v-if="calcMode === 'standard'"
        class="quick-nav-bar fixed left-0 right-0 max-w-md mx-auto px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] bg-[#080808] border-t border-white/10 shrink-0 z-[230]"
        style="bottom: var(--app-footer-height, var(--bottom-nav-h, calc(64px + env(safe-area-inset-bottom, 0px))));"
      >
        <div v-if="quickStep < 3" class="quick-nav-buttons quick-nav-step grid gap-1" style="grid-template-columns: auto 1fr auto; align-items: center;">
          <button
            type="button"
            @click="goQuickBack"
            class="quick-nav-btn quick-nav-btn-back shrink-0 py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[40px] rounded-xl"
          >
            <span class="inline-flex items-center gap-1"><span aria-hidden="true">&lsaquo;</span> Назад</span>
          </button>
          <div class="quick-nav-price text-center overflow-hidden px-1 min-w-0 flex items-center justify-center">
            <div class="quick-nav-price-value text-[17px] font-bold text-metric-green tabular-nums truncate">{{ animatedQuickPrice.toLocaleString('ru-RU') }} ₽</div>
          </div>
          <button
            data-testid="btn-next-step"
            type="button"
            @click="goQuickNext"
            :disabled="(quickStep === 1 && userSettings.showClientQuick && !clientDataValid) || ((quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick)) && !quickStep2Valid)"
            class="quick-nav-btn quick-nav-btn-next shrink-0 py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 transition-all hover:bg-metric-green/10 min-h-[40px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="inline-flex items-center gap-1">Вперёд <span aria-hidden="true">&rsaquo;</span></span>
          </button>
        </div>
        <div v-else class="qc-step3-actions flex gap-0">
          <button
            type="button"
            @click="goQuickBack"
            class="qc-s3-btn qc-s3-btn--left flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[40px]"
          >
            Назад
          </button>
          <button
            data-testid="btn-save-estimate"
            type="button"
            @click="saveCurrentEstimate('quick')"
            class="qc-s3-btn qc-s3-btn--mid flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white border border-white/15 min-h-[40px] transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSavingHistory || !quickStep3Ready"
          >
            {{ isSavingHistory ? '...' : 'Сохранить' }}
          </button>
          <button
            type="button"
            @click="saveAndBookEstimate('quick')"
            class="qc-s3-btn qc-s3-btn--right flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 min-h-[40px] transition-colors hover:bg-metric-green/10 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSavingHistory || !quickStep3Ready"
          >
            {{ isSavingHistory ? '...' : 'Записать' }}
          </button>
        </div>
      </div>
      </template>
    </div>

    <!-- Section: History: list and detail use v-show so filter context is preserved on back -->
    <div v-if="currentSection === 'history'" class="flex flex-col min-h-0 overflow-hidden" style="flex:1">
    <div v-show="!selectedHistory" class="content-padding-bottom p-4 flex flex-col min-h-0 overflow-hidden flex-1">
      <div v-if="postSaveAnalytics" class="post-save-hint mb-3">
        <span class="post-save-hint__icon">📊</span>
        <span class="post-save-hint__text">{{ postSaveAnalytics.message }}</span>
      </div>
      <div class="app-header-logo-bar shrink-0">
        <div class="app-header-logo-bar__left">
          <button
            type="button"
            @click="goHome"
            class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[40px] flex items-center gap-1"
          >
            <span>←</span>
            <span>Домой</span>
          </button>
        </div>
        <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo" onerror="this.style.display='none'">
        <div class="app-header-logo-bar__right"></div>
      </div>
      <HistoryScreen
        class="flex-1 min-h-0"
        :history-items="historyItems"
        :footer-height="'var(--app-footer-height, 64px)'"
        :client-phone-filter="historyClientPhoneFilter"
        @back="goHome"
        @select="selectedHistoryId = $event"
        @update-status="handleHistoryStatusUpdate"
        @clear-client-filter="historyClientPhoneFilter = ''"
      />
    </div>
    <!-- DEV-only: QA history generator -->
    <div
      v-show="isDev && qaEnabled && !selectedHistory"
      class="fixed left-4 bottom-[calc(var(--app-footer-height,64px)+80px)] z-[220] flex flex-col gap-2"
    >
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/90 text-black border border-amber-400"
        @click="generateQaHistoryRecords"
      >
        Generate 20 records
      </button>
    </div>
    <!-- History Detail overlay: scrollable content + sticky action bar above tab bar -->
    <div v-if="selectedHistory" class="history-detail-wrapper flex flex-col min-h-0 flex-1">
      <div class="history-detail-content flex-1 min-h-0 overflow-y-auto content-padding-bottom p-4 space-y-3" style="-webkit-overflow-scrolling: touch">
      <div class="app-header-logo-bar shrink-0">
        <div class="app-header-logo-bar__left">
          <button
            type="button"
            @click="goHome"
            class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[40px] flex items-center gap-1"
          >
            <span>←</span>
            <span>Домой</span>
          </button>
        </div>
        <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo" onerror="this.style.display='none'">
        <div class="app-header-logo-bar__right"></div>
      </div>
      <div class="card-metallic rounded-2xl p-4 space-y-2">
        <div class="text-xs text-gray-400 uppercase tracking-widest">Сохранённая оценка</div>
        <div class="flex justify-between text-sm"><span class="text-gray-400">Дата:</span><span class="text-white font-medium">{{ formatDateTime(selectedHistory.createdAt) }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-400">Режим:</span><span class="text-white font-medium">{{ selectedHistory.mode === 'detail' ? 'Детализация' : 'Быстрый расчёт' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-400">Элемент:</span><span class="text-white font-medium">{{ selectedHistory.element || '—' }}</span></div>
        <div v-if="selectedHistory.discountPercent > 0" class="flex justify-between text-sm"><span class="text-amber-400">Скидка:</span><span class="text-amber-400 font-medium">−{{ selectedHistory.discountPercent }}%</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-400">Итог:</span><span class="text-metric-green font-bold">{{ formatCurrency(historyDisplayTotal) }} ₽</span></div>
        <div v-if="selectedHistory.isPriceManuallyAdjusted && selectedHistory.dmCalculatedPrice != null" class="text-[11px] text-gray-500 mt-1">
          изменено, расчёт DM = <span class="line-through">{{ formatCurrency(selectedHistory.dmCalculatedPrice) }}₽</span> → <span class="text-metric-green font-semibold">{{ formatCurrency(selectedHistory.manualAdjustedPrice) }}₽</span>
        </div>
      </div>
      <div v-if="isEditingHistory" class="card-metallic rounded-2xl p-4 space-y-3">
        <div class="text-[10px] font-bold text-metric-green uppercase tracking-widest">Редактирование</div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[14px] text-white min-h-[42px]" @click="openHistoryEditField('clientName', 'Имя', 'text')"><span class="truncate">{{ historyEditDraft.clientName || 'Имя' }}</span><span class="text-gray-500 shrink-0">✎</span></button>
          <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[14px] text-white min-h-[42px]" @click="openHistoryEditField('clientPhone', 'Тел', 'tel')"><span class="truncate">{{ historyEditDraft.clientPhone || 'Тел' }}</span><span class="text-gray-500 shrink-0">✎</span></button>
          <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[14px] text-white min-h-[42px]" @click="openHistoryEditField('carBrand', 'Марка', 'text')"><span class="truncate">{{ historyEditDraft.carBrand || 'Марка' }}</span><span class="text-gray-500 shrink-0">✎</span></button>
          <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[14px] text-white min-h-[42px]" @click="openHistoryEditField('carModel', 'Модель', 'text')"><span class="truncate">{{ historyEditDraft.carModel || 'Модель' }}</span><span class="text-gray-500 shrink-0">✎</span></button>
        </div>
        <button type="button" class="input-row w-full flex items-center justify-between gap-2 rounded-xl px-3 py-3 min-h-[42px] bg-[#151515] border border-[#333] text-left text-[14px] text-white" @click="openHistoryCommentModal"><span class="truncate flex-1">{{ historyEditDraft.comment || 'Комментарий' }}</span><span class="text-gray-500 shrink-0">✎</span></button>
        <div class="flex items-center justify-between gap-3 py-1">
          <span class="text-sm text-gray-300 flex-1">Скидка (%)</span>
          <input type="number" v-model.number="historyEditDraft.discountPercent" min="0" max="100" class="w-24 bg-[#151515] border border-[#333] rounded-lg px-3 py-2 text-sm text-right text-white focus:border-metric-green outline-none">
        </div>
        <div class="space-y-2">
          <span class="text-sm text-gray-300">Изменить стоимость вручную</span>
          <div class="flex gap-2 items-center">
            <input type="number" v-model.number="historyEditDraft.editManualPrice" placeholder="Сумма" class="flex-1 bg-[#151515] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-metric-green outline-none" inputmode="numeric">
            <button type="button" @click="historyEditDraft.editManualPrice = null" class="text-xs text-gray-500 border border-white/10 rounded-lg px-2 py-2">Сбросить</button>
          </div>
        </div>
        <div class="attachment-edit">
          <AttachmentPicker :record-id="selectedHistory?.id || ''" :dent-index="0" :model-value="historyEditDraft.attachments" @update:model-value="historyEditDraft.attachments = $event" />
        </div>
        <div class="flex gap-2">
          <button type="button" @click="cancelHistoryEdit" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/10 rounded-xl min-h-[40px]">Отмена</button>
          <button type="button" @click="saveHistoryEdit" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[40px] disabled:opacity-50" :disabled="isUpdatingHistory">{{ isUpdatingHistory ? '...' : 'Сохранить' }}</button>
        </div>
      </div>
      <ResultFourTabs v-if="!isEditingHistory" v-model="historyFinalTab" class="history-final-tabs min-h-0">
        <div class="hist-final-panels flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pb-2">
          <section v-show="historyFinalTab === 'calculation'" class="hist-final-page space-y-3" aria-label="Расчёт">
            <div class="card-metallic rounded-2xl p-4 space-y-3">
              <div class="text-[10px] font-bold text-metric-green uppercase tracking-widest">Статус</div>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="st in historyDetailStatuses"
                  :key="st.key"
                  type="button"
                  class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border min-h-[36px] transition-all"
                  :class="selectedHistory.status === st.key ? st.activeClass : 'border-white/10 text-gray-500'"
                  @click="changeDetailStatus(st.key)"
                >{{ st.label }}</button>
              </div>
            </div>
            <div class="price-grand-total card-metallic rounded-xl flex justify-between items-center px-5 py-4 mb-2">
              <span class="pgt-label text-[14px] text-gray-500">Итого по всем повреждениям</span>
              <span class="pgt-amount text-[24px] font-bold text-metric-green tabular-nums">{{ formatCurrency(historyDisplayTotal) }} ₽</span>
            </div>
            <template v-for="(dentItem, idx) in historyLineItems" :key="dentItem.dent?.id || idx">
              <div class="space-y-1">
                <div class="px-1">
                  <div class="flex items-baseline gap-2 mb-0.5">
                    <span class="text-white font-bold text-[15px]">Вмятина ‑{{ idx + 1 }}</span>
                    <span class="text-gray-300 font-semibold text-[14px] truncate">{{ dentItem.dent?.panelElement || '—' }}</span>
                  </div>
                  <div class="text-[11px] text-gray-400 leading-snug">{{ getHistoryDentLabel(dentItem.dent) }} длина: {{ formatSingleDim(dentItem.dent?.sizeLengthMm) }}, Высота: {{ formatSingleDim(dentItem.dent?.sizeWidthMm) }}</div>
                </div>
                <div class="card-metallic rounded-xl qc-breakdown-card">
                  <div class="qc-bk-row qc-bk-row--base">
                    <span class="qc-bk-label font-semibold text-white">Базовая стоимость:</span>
                    <span class="qc-bk-delta text-metric-green font-bold">{{ formatRoundedPrice(dentItem.base) }} ₽</span>
                  </div>
                  <div class="qc-bk-sep"></div>
                  <div v-for="(row, ri) in buildDetailedBreakdown(dentItem)" :key="ri" class="qc-bk-row">
                    <span class="qc-bk-label">{{ row.label }}</span>
                    <span class="qc-bk-value">{{ row.value }}</span>
                    <span class="qc-bk-delta" :class="deltaClass(row.delta)">{{ formatDelta(row.delta) }}</span>
                  </div>
                  <div class="qc-bk-sep"></div>
                  <div class="qc-bk-row">
                    <span class="qc-bk-label">Скидка:</span>
                    <span class="qc-bk-value flex-1 text-gray-500 text-[11px]">{{ dentItem.discountPercent ? dentItem.discountPercent : '—' }}%</span>
                    <span v-if="dentItem.discountPercent > 0" class="qc-bk-delta text-amber-400 text-[11px]">−{{ formatCurrency(dentItem.discountAmount ?? ((dentItem.preDiscountTotal || dentItem.appliedTotal) - dentItem.appliedTotal)) }} ₽</span>
                  </div>
                  <div class="qc-bk-sep qc-bk-sep--strong"></div>
                  <div class="qc-bk-row qc-bk-row--total">
                    <span class="font-bold text-white text-[13px]">Итог по вмятине:</span>
                    <span class="text-metric-green font-bold text-[18px] tabular-nums">{{ formatRoundedPrice(dentItem.appliedTotal) }} ₽</span>
                  </div>
                </div>
              </div>
            </template>
            <PrepaymentBlock
              :model-value="selectedHistory.prepayment ?? { amount: 0, method: null }"
              :readonly="true"
            />
          </section>
          <section v-show="historyFinalTab === 'client'" class="hist-final-page space-y-3" aria-label="Клиент">
            <div class="card-metallic rounded-2xl p-4 space-y-2">
              <div class="text-[10px] font-bold text-metric-green uppercase tracking-widest mb-2">Клиент</div>
              <div class="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                <div>Имя: <span class="text-white">{{ selectedHistory.client?.name || '—' }}</span></div>
                <div class="col-span-2 flex items-center justify-between gap-2">
                  <span>Тел: <span class="text-white">{{ selectedHistory.client?.phone || '—' }}</span></span>
                  <a
                    v-if="(selectedHistory.client?.phone || '').trim()"
                    :href="`tel:${historyDetailTelHref}`"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-metric-green text-black border border-metric-green/40"
                  >Позвонить</a>
                </div>
                <div>Марка: <span class="text-white">{{ selectedHistory.client?.brand || '—' }}</span></div>
                <div>Модель: <span class="text-white">{{ selectedHistory.client?.model || '—' }}</span></div>
              </div>
            </div>
            <div class="card-metallic rounded-2xl p-4">
              <ClientMoodPicker :model-value="historyEditDraft.clientMood ?? selectedHistory.clientMood ?? null" @update:model-value="onHistoryMoodChange($event)" />
            </div>
          </section>
          <section v-show="historyFinalTab === 'files'" class="hist-final-page space-y-3" aria-label="Файлы">
            <div v-if="selectedHistory.comment" class="card-metallic rounded-2xl p-4 space-y-2">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Комментарий</div>
              <div class="text-sm text-gray-300">{{ selectedHistory.comment }}</div>
            </div>
            <HistoryAttachmentsView v-if="(selectedHistory.attachments || []).length > 0" :attachments="selectedHistory.attachments" />
            <div v-if="!selectedHistory.comment && !(selectedHistory.attachments || []).length" class="text-center text-gray-500 text-sm py-10">
              Нет комментария и вложений
            </div>
          </section>
          <section
            v-show="historyFinalTab === 'demo'"
            class="hist-final-page hist-final-page--demo card-metallic rounded-2xl p-6 text-center text-gray-500 text-sm"
            aria-label="Демонстрация"
          >
            <p class="m-0 text-white/90 font-medium">Демонстрация для клиента</p>
            <p class="text-xs mt-3 opacity-70 m-0 leading-relaxed">Раздел в разработке — здесь будет сценарий показа оценки клиенту.</p>
          </section>
        </div>
      </ResultFourTabs>
      <PrepaymentBlock
        v-if="isEditingHistory"
        :model-value="historyEditDraft.prepayment"
        :readonly="false"
        @update:model-value="(v) => { historyEditDraft.prepayment = v; }"
      />
      </div>
      <!-- Sticky action bar: fixed above tab bar, always visible -->
      <div class="history-detail-actions">
        <div class="history-detail-actions__inner flex gap-2 p-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] bg-black border-t border-white/10">
          <button type="button" data-testid="btn-history-back" @click="selectedHistoryId = null" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/10 rounded-xl min-h-[44px]">Назад</button>
          <button v-if="!isEditingHistory" type="button" @click="startHistoryEdit" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px]">Редакт.</button>
          <button type="button" @click="deleteHistoryConfirm(selectedHistory.id)" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-red-400 border border-red-500/40 rounded-xl min-h-[44px]">Удалить</button>
        </div>
      </div>
    </div>
    </div>

    <!-- Section: Settings -->
    <div v-if="currentSection === 'settings'" class="settings-screen flex flex-col min-h-0 flex-1">
      <div ref="settingsScrollRef" class="settings-screen__content">
        <div class="app-header-logo-bar shrink-0">
          <div class="app-header-logo-bar__left">
            <button type="button" @click="goHome" class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[40px] flex items-center gap-1">
              <span>←</span><span>Домой</span>
            </button>
          </div>
          <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo" style="border:none;box-shadow:none" onerror="this.style.display='none'">
          <div class="app-header-logo-bar__right"></div>
        </div>
        <h1 class="settings-screen__title">Настройки</h1>
        <div class="settings-sections">
        <!-- 1. Ценообразование -->
        <div ref="(el) => setSettingsSectionRef('pricing', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'pricing' }" @click="toggleSettingsSection('pricing')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">💰</span>
              <span class="dm-section-header__title">Ценообразование</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'pricing' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'pricing'" class="settings-section-content">
            <div class="dm-settings-row dm-settings-row--stacked">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Округление цены</span>
                <span class="dm-settings-row__description">Применяется только к отображению и сохранению.</span>
              </div>
              <div class="dm-settings-row__control dm-settings-row__control--full">
                <div class="dm-segment-group">
                  <label v-for="opt in PRICE_ROUND_OPTIONS" :key="opt.value" class="dm-segment-btn" :class="{ active: userSettings.priceRoundStep === opt.value }">
                    <input v-model="userSettings.priceRoundStep" type="radio" :value="opt.value" class="sr-only">
                    <span>{{ opt.label }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Единицы размеров</span>
                <span class="dm-settings-row__description">Отображение в списках. Ввод всегда в мм.</span>
              </div>
              <div class="dm-settings-row__control">
              <div class="dm-segment-group">
                <label class="dm-segment-btn" :class="{ active: userSettings.sizeUnit === 'mm' }">
                  <input v-model="userSettings.sizeUnit" type="radio" value="mm" class="sr-only">
                  <span>мм</span>
                </label>
                <label class="dm-segment-btn" :class="{ active: userSettings.sizeUnit === 'cm' }">
                  <input v-model="userSettings.sizeUnit" type="radio" value="cm" class="sr-only">
                  <span>см</span>
                </label>
              </div>
              </div>
            </div>
            <div class="dm-settings-subsection-label">Регулятор цен: Круг / Овал</div>
            <div class="dm-settings-row dm-settings-row--stacked">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Множитель</span>
                <span class="dm-settings-row__description">Применяется к базовым ценам при расчёте.</span>
              </div>
              <div class="dm-settings-row__control dm-settings-row__control--full">
                <div class="dm-segment-group">
                  <button type="button" data-testid="price-regulator-round-minus" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierRoundOval === 90 }" @click="applyPriceRegulator('roundOval', -10)">−10%</button>
                  <button type="button" data-testid="price-regulator-round-zero" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierRoundOval === 100 }" @click="applyPriceRegulator('roundOval', 0)">0%</button>
                  <button type="button" data-testid="price-regulator-round-plus" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierRoundOval === 110 }" @click="applyPriceRegulator('roundOval', 10)">+10%</button>
                </div>
              </div>
            </div>
            <p class="dm-settings-multiplier-value">Множитель: {{ effectivePriceMultiplierRoundOval }}%</p>
            <div class="dm-settings-subsection-label">Регулятор цен: Полоса / Царапина</div>
            <div class="dm-settings-row dm-settings-row--stacked">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Множитель</span>
                <span class="dm-settings-row__description">Применяется к базовым ценам при расчёте.</span>
              </div>
              <div class="dm-settings-row__control dm-settings-row__control--full">
                <div class="dm-segment-group">
                  <button type="button" data-testid="price-regulator-stripe-minus" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierStripe === 90 }" @click="applyPriceRegulator('stripe', -10)">−10%</button>
                  <button type="button" data-testid="price-regulator-stripe-zero" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierStripe === 100 }" @click="applyPriceRegulator('stripe', 0)">0%</button>
                  <button type="button" data-testid="price-regulator-stripe-plus" class="dm-segment-btn" :class="{ active: effectivePriceMultiplierStripe === 110 }" @click="applyPriceRegulator('stripe', 10)">+10%</button>
                </div>
              </div>
            </div>
            <p class="dm-settings-multiplier-value">Множитель: {{ effectivePriceMultiplierStripe }}%</p>
            <div class="dm-settings-subsection-label">Скидка на 2-ю вмятину (один элемент)</div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Включить</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-discount-same-part" v-model="userSettings.discountSamePartEnabled" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div v-if="userSettings.discountSamePartEnabled" class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Скидка (%)</span>
              </div>
              <button type="button" data-testid="settings-discount-same-part-percent" class="dm-number-input dm-number-input--action" @click="openDiscountSamePartModal">
                <span>{{ userSettings.discountSamePartValue }}</span>
                <span class="dm-number-input__edit">✎</span>
              </button>
            </div>
            <div class="dm-settings-subsection-label">Скидка на 2-ю вмятину (другой элемент)</div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Включить</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-discount-diff-part" v-model="userSettings.discountDiffPartEnabled" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div v-if="userSettings.discountDiffPartEnabled" class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Скидка (%)</span>
              </div>
              <button type="button" data-testid="settings-discount-diff-part-percent" class="dm-number-input dm-number-input--action" @click="openDiscountDiffPartModal">
                <span>{{ userSettings.discountDiffPartValue }}</span>
                <span class="dm-number-input__edit">✎</span>
              </button>
            </div>
            <div class="dm-settings-subsection-label">1.2 Базовый прайс</div>
            <p class="settings-helper-text mb-2">Для правильного формирования стоимости работ, задайте свой прайс на удаление ПЛАВНОЙ вмятины в ЛЁГКОМ доступе. На данный момент средние рыночные значения уже установлены. Всё остальное матричная система расчёта DentMetric посчитает сама.</p>
            <div class="dm-settings-subsection-label">Круг/Овал</div>
            <div v-for="size in initialData.circleSizes" :key="size.code" class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">{{ size.code }}</span>
                <span class="dm-settings-row__description">{{ size.name }}</span>
              </div>
              <input type="number" v-model.number="userSettings.prices[size.code]" inputmode="numeric" class="dm-number-input dm-number-input--wide">
            </div>
            <div class="dm-settings-subsection-label">Полоса / Царапина</div>
            <div v-for="size in initialData.stripSizes" :key="size.code" class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">{{ size.code }}</span>
                <span class="dm-settings-row__description">{{ size.name }}</span>
              </div>
              <input type="number" v-model.number="userSettings.prices[size.code]" inputmode="numeric" class="dm-number-input dm-number-input--wide">
            </div>
          </div>
        </div>

        <!-- 2. Арматурные работы -->
        <div ref="(el) => setSettingsSectionRef('armature', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'armature' }" @click="toggleSettingsSection('armature')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">🔧</span>
              <span class="dm-section-header__title">Арматурные работы</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'armature' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'armature'" class="settings-section-content">
            <p class="settings-helper-text mb-2">Редактирование цен системных работ и добавление пользовательских.</p>
            <div v-for="w in systemArmatureWorks" :key="w.code" class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">{{ w.name }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <input type="number" :value="effectiveArmaturePrice(w.code)" @input="setArmaturePriceOverride(w.code, $event.target.value)" inputmode="numeric" class="dm-number-input">
                <span class="text-gray-500 text-sm">₽</span>
              </div>
            </div>
            <div v-for="(cw, idx) in userSettings.customArmatureWorks" :key="cw.id" class="dm-settings-row dm-settings-row--custom">
              <input type="text" v-model="cw.name" placeholder="Название" class="dm-text-input flex-1">
              <input type="number" v-model.number="cw.price" placeholder="₽" class="dm-number-input">
              <button type="button" @click="removeCustomArmatureWork(idx)" class="dm-settings-row__remove" aria-label="Удалить">✕</button>
            </div>
            <div class="dm-settings-row dm-settings-row--add">
              <input v-model="newArmatureWorkName" type="text" placeholder="введите название" class="dm-text-input flex-1">
              <input v-model.number="newArmatureWorkPrice" type="number" placeholder="₽" class="dm-number-input">
              <button type="button" @click="addCustomArmatureWork" class="dm-segment-btn dm-segment-btn--add">+</button>
            </div>
          </div>
        </div>

        <!-- 3. Интерфейс -->
        <div ref="(el) => setSettingsSectionRef('interface', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'interface' }" @click="toggleSettingsSection('interface')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">⚙️</span>
              <span class="dm-section-header__title">Интерфейс</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'interface' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'interface'" class="settings-section-content">
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Показывать подсказки (i)</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-tooltips" v-model="userSettings.showInfoTooltips" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Экран клиента в режиме «Быстрый»</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-client-quick" v-model="userSettings.showClientQuick" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Экран клиента в режиме «Детализация»</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-client-detail" v-model="userSettings.showClientDetail" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 4. Клиент -->
        <div ref="(el) => setSettingsSectionRef('client', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'client' }" @click="toggleSettingsSection('client')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">👤</span>
              <span class="dm-section-header__title">Клиент</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'client' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'client'" class="settings-section-content">
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Данные клиента обязательны</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-client-required" v-model="userSettings.clientRequired" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row" :class="{ 'opacity-70': !userSettings.clientRequired }">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Телефон обязателен</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-require-phone" v-model="userSettings.requirePhone" type="checkbox" class="sr-only peer" :disabled="!userSettings.clientRequired">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row" :class="{ 'opacity-70': !userSettings.clientRequired }">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Имя обязательно</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-require-name" v-model="userSettings.requireName" type="checkbox" class="sr-only peer" :disabled="!userSettings.clientRequired">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row" :class="{ 'opacity-70': !userSettings.clientRequired }">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Марка/Модель обязательны</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-require-car-brand-model" v-model="userSettings.requireCarBrandModel" type="checkbox" class="sr-only peer" :disabled="!userSettings.clientRequired">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 5. Обязательные поля -->
        <div ref="(el) => setSettingsSectionRef('required', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'required' }" @click="toggleSettingsSection('required')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">📋</span>
              <span class="dm-section-header__title">Обязательные поля</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'required' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'required'" class="settings-section-content">
            <p class="settings-helper-text mb-2">Включите только нужные параметры, чтобы ускорить быстрый расчёт.</p>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Показывать Время ремонта (мастера)</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-repair-time" v-model="userSettings.showRepairTime" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Показывать Материал ЛКП</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-paint-material" v-model="userSettings.showPaintMaterial" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Показывать Шумоизоляция</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-show-sound-insulation" v-model="userSettings.showSoundInsulation" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 6. История -->
        <div ref="(el) => setSettingsSectionRef('history', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'history' }" @click="toggleSettingsSection('history')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">📁</span>
              <span class="dm-section-header__title">История</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'history' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'history'" class="settings-section-content">
            <div class="dm-settings-row">
              <div class="dm-settings-row__label-area">
                <span class="dm-settings-row__label">Автосохранение в историю</span>
              </div>
              <label class="dm-settings-row__toggle">
                <input data-testid="settings-auto-save-history" v-model="userSettings.autoSaveHistory" type="checkbox" class="sr-only peer">
                <div class="dm-toggle-track peer-checked:dm-toggle-track--on"></div>
                <div class="dm-toggle-thumb peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 7. Мастера -->
        <div ref="(el) => setSettingsSectionRef('masters', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'masters' }" @click="toggleSettingsSection('masters')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">👷</span>
              <span class="dm-section-header__title">Мастера</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'masters' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'masters'" class="settings-section-content">
            <div class="dm-settings-row dm-settings-row--header">
              <span class="dm-settings-row__label">Имя и ставка (₽/час)</span>
              <button type="button" @click="addMaster" class="dm-segment-btn dm-segment-btn--add">+ Добавить</button>
            </div>
            <div v-for="(m, idx) in userSettings.masters" :key="idx" class="dm-settings-row dm-settings-row--custom">
              <input v-model="m.name" placeholder="Имя" class="dm-text-input flex-1">
              <input type="number" v-model.number="m.rate" placeholder="₽/час" class="dm-number-input">
              <button type="button" @click="removeMaster(idx)" class="dm-settings-row__remove" aria-label="Удалить">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Sticky save bar (sibling of content, not inside scroll) -->
      <div class="settings-screen__footer">
        <button type="button" data-testid="btn-save-settings" @click="saveSettings" class="dm-btn dm-btn--primary dm-btn--full">Сохранить настройки</button>
        <button type="button" @click="resetDefaults" class="dm-btn dm-btn--secondary dm-btn--full">Сбросить к стандартным</button>
      </div>
    </div>

    <!-- Section: Info -->
    <div ref="infoScrollRef" v-if="currentSection === 'info'" class="content-padding-bottom p-4 space-y-3 overflow-y-auto">
      <InfoScreen @home="goHome" />
    </div>

    <!-- Section: Account / Plans / Onboarding / Referral / Payments / Stats -->
    <div v-if="currentSection === 'account'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="profile" @back="switchSection('home')">
        <ProfileSection
          @edit="switchSection('onboarding')"
          @plans="switchSection('plans')"
          @payments="switchSection('payments')"
          @referral="switchSection('referral')"
          @stats="switchSection('stats')"
          @logout="switchSection('home')"
        />
      </AccountScreen>
    </div>
    <div v-else-if="currentSection === 'plans'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="plans" @back="switchSection('account')">
        <PlansSection />
      </AccountScreen>
    </div>
    <div v-else-if="currentSection === 'onboarding'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="onboarding" @back="switchSection('home')">
        <OnboardingSection @complete="switchSection('account')" />
      </AccountScreen>
    </div>
    <div v-else-if="currentSection === 'referral'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="referral" @back="switchSection('account')">
        <ReferralSection />
      </AccountScreen>
    </div>
    <div v-else-if="currentSection === 'payments'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="payments" @back="switchSection('account')">
        <PaymentsSection />
      </AccountScreen>
    </div>
    <div v-else-if="currentSection === 'stats'" class="flex flex-col min-h-0 flex-1">
      <AccountScreen view="stats" @back="switchSection('account')">
        <MasterStatsSection @upgrade="switchSection('plans')" />
      </AccountScreen>
    </div>

    <!-- Locked sections (analytics, journal) -->
    <div v-if="currentSection === 'analytics' || currentSection === 'journal'" class="p-4 flex flex-col h-full pb-24">
      <div class="app-header-logo-bar">
        <div class="app-header-logo-bar__left">
          <button
            type="button"
            @click="goHome"
            class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[40px] flex items-center gap-1"
          >
            <span>←</span>
            <span>Домой</span>
          </button>
        </div>
        <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo" onerror="this.style.display='none'">
        <div class="app-header-logo-bar__right"></div>
      </div>
      <div class="card-metallic rounded-2xl p-6 text-center text-gray-400 mt-6">
        <div class="text-2xl mb-2">🔒</div>
        <div class="text-sm">Раздел в разработке</div>
      </div>
    </div>

    <!-- Bottom nav: fixed, safe-area aware, unified selected state -->
    <nav
      ref="bottomNavRef"
      class="bottom-nav fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-[#080808] border-t border-white/10 flex justify-around items-stretch gap-0 py-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] z-[200] shadow-[0_-4px_16px_rgba(0,0,0,0.6)]"
      role="navigation"
      aria-label="Основное меню"
    >
      <button
        type="button"
        data-testid="nav-history"
        @click="goToHistory"
        class="bottom-nav-btn flex-1 min-w-0 py-2.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation"
        :class="currentSection === 'history' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'history' ? 'page' : undefined"
        :aria-label="currentSection === 'history' ? 'История (текущий раздел)' : 'История'"
      >
        <span class="text-xl" aria-hidden="true">🗂️</span>
        <span class="text-[9px] font-bold uppercase tracking-widest">История</span>
      </button>
      <button
        type="button"
        data-testid="nav-settings"
        @click="switchSection('settings')"
        class="bottom-nav-btn flex-1 min-w-0 py-2.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation"
        :class="currentSection === 'settings' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'settings' ? 'page' : undefined"
        :aria-label="currentSection === 'settings' ? 'Настройки (текущий раздел)' : 'Настройки'"
      >
        <span class="text-xl" aria-hidden="true">⚙️</span>
        <span class="text-[9px] font-bold uppercase tracking-widest">Настройки</span>
      </button>
      <button
        type="button"
        data-testid="nav-metric"
        @click="openMetricMenu"
        class="bottom-nav-btn flex-1 min-w-0 py-2.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation"
        :class="currentSection === 'metric' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'metric' ? 'page' : undefined"
        :aria-label="currentSection === 'metric' ? 'Метрика (текущий раздел)' : 'Метрика'"
      >
        <span class="text-xl" aria-hidden="true">🧮</span>
        <span class="text-[9px] font-bold uppercase tracking-widest">Метрика</span>
      </button>
      <button
        type="button"
        @click="switchSection('info')"
        class="bottom-nav-btn flex-1 min-w-0 py-2.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation"
        :class="currentSection === 'info' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'info' ? 'page' : undefined"
        :aria-label="currentSection === 'info' ? 'Инфо (текущий раздел)' : 'Инфо'"
      >
        <span class="text-xl" aria-hidden="true">ℹ️</span>
        <span class="text-[9px] font-bold uppercase tracking-widest">Инфо</span>
      </button>
      <button
        type="button"
        data-testid="nav-home"
        @click="goHome"
        class="bottom-nav-btn flex-1 min-w-0 py-2.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation"
        :class="currentSection === 'home' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'home' ? 'page' : undefined"
        :aria-label="currentSection === 'home' ? 'Домой (текущий раздел)' : 'Домой'"
      >
        <span class="text-xl" aria-hidden="true">🏠</span>
        <span class="text-[9px] font-bold uppercase tracking-widest">Домой</span>
      </button>
    </nav>
    <Transition name="toast">
      <div
        v-if="toast.visible"
        class="fixed left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl backdrop-blur-sm flex flex-col items-center gap-2"
        :class="toast.type === 'error' ? 'toast-error' : 'toast-success'"
        style="bottom: calc(16px + env(safe-area-inset-bottom, 0px));"
      >
        <span>{{ toast.text }}</span>
        <button
          v-if="toast.actionText && toast.onAction"
          type="button"
          class="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold uppercase tracking-wider touch-manipulation"
          @click="() => { toast.onAction?.(); toast.visible = false; toast.actionText = null; toast.onAction = null; if (toast.timeoutId) clearTimeout(toast.timeoutId); toast.timeoutId = null; }"
        >
          {{ toast.actionText }}
        </button>
      </div>
    </Transition>
    <PaywallModal :visible="paywallVisible" :min-plan="paywallMinPlan" @close="closePaywall" @go-plans="switchSection('plans'); closePaywall();" />
    <NotificationStack />
    <InputModal :model-value="inputModalOpen" :config="inputModalConfig" @confirm="inputModalConfirm" @cancel="inputModalCancel" />
    <SelectModal :model-value="selectModalOpen" :config="selectModalConfig" @confirm="selectModalConfirm" @cancel="selectModalCancel" />
    <PresetsModal v-model="presetsModalOpen" @select="onPresetSelected" />
    <component :is="QAOverlayComp" v-if="qaEnabled && QAOverlayComp" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick, onBeforeUnmount, provide, defineAsyncComponent } from 'vue';
import { deleteSelected } from './graphics/konvaEditor';
import { initialData } from './data/initialData';
import {
  formatArmaturnayaSummary,
  getArmaturnayaWorksForElement,
  getArmaturnayaTotalPrice,
  getAllSystemArmatureWorks,
} from './data/armaturnayaWorks';
import { normalizeArmatureWorkIds, toggleArmatureWorkIds } from './utils/armatureSelection';
import { CAR_PARTS } from './data/carParts';
import { getPartsByClass } from './data/partsCatalog';
import { circleSizesMm, stripSizesMm, circleSizesWithArea, stripSizesWithArea } from './data/dentSizes';
import { calcBasePriceFromDents, calcTotalPrice, buildBreakdown } from './utils/priceCalc';
import { calculateDentPrice as calcDentViaAdapter, normalizeGraphicsDentsForPricing, normalizeDimensions } from './features/pricing/pricingAdapter';
import { resolveDentShapeType, getResolvedShapeDisplayLabel } from './utils/resolveDentShapeType';
import { applyPriceRoundingCeil, PRICE_ROUND_OPTIONS } from './utils/priceRounding';
import { applyDiscount, clampDiscount } from './utils/discount';
import { calculateEstimateTotals } from './utils/calculateEstimateTotals';
import { calculateSessionTotalWithMultiDentRule } from './utils/multiDentAggregation';
import { buildQuickFinalBreakdown } from './utils/buildQuickFinalBreakdown';
import { migrateSettings, validateSettings, getPriceMultiplier, SETTINGS_KEY } from './utils/settingsUtils';
import GraphicsWizard from './components/graphics/GraphicsWizard.vue';
import StepDots from './components/graphics/StepDots.vue';
import InfoIcon from './components/InfoIcon.vue';
import AppWowBackground from './components/AppWowBackground.vue';
import TopBrandBar from './components/TopBrandBar.vue';
import WowScreenShell from './components/WowScreenShell.vue';
import { getElementIconPath } from './utils/elementIcons';
import { useHistoryStore, generateRecordId } from './features/history/historyStore';
import InputModal from './components/InputModal.vue';
import { useInputModal } from './composables/useInputModal';
import SelectModal from './components/SelectModal.vue';
import { useSelectModal } from './composables/useSelectModal';
import { useAnimatedNumber } from './composables/useAnimatedNumber';
import PresetsModal from './components/PresetsModal.vue';
import SegmentedControl from './components/ui/SegmentedControl.vue';
import SelectRow from './components/ui/SelectRow.vue';
import { hideTelegramButtons } from './utils/telegramButtons';
import HistoryScreen from './components/HistoryScreen.vue';
import InfoScreen from './components/info/InfoScreen.vue';
import AttachmentPicker from './components/AttachmentPicker.vue';
import HistoryAttachmentsView from './components/HistoryAttachmentsView.vue';
import ClientInfoBlock from './components/ClientInfoBlock.vue';
import ClientFoundCard from './components/ClientFoundCard.vue';
import StandardQuickFinalScreen from './components/result/StandardQuickFinalScreen.vue';
import ResultFourTabs from './components/result/ResultFourTabs.vue';
import { useClientSearch } from './composables/useClientSearch';
import { calcPostSaveAnalytics, applyClientFields, normalizePhone } from './utils/clientSearch';
import ClientMoodPicker from './components/ClientMoodPicker.vue';
import PrepaymentBlock from './components/PrepaymentBlock.vue';
import { useAccount } from './modules/account/useAccount';
import { useFeatureGate } from './modules/account/useFeatureGate';
import { expandTelegramWebApp } from './modules/account/utils/telegram';
import AccountScreen from './modules/account/components/AccountScreen.vue';
import ProfileSection from './modules/account/components/ProfileSection.vue';
import PlansSection from './modules/account/components/PlansSection.vue';
import OnboardingSection from './modules/account/components/OnboardingSection.vue';
import PaywallModal from './modules/account/components/PaywallModal.vue';
import ReferralSection from './modules/account/components/ReferralSection.vue';
import PaymentsSection from './modules/account/components/PaymentsSection.vue';
import MasterStatsSection from './modules/account/components/MasterStatsSection.vue';
import NotificationStack from './modules/account/components/NotificationStack.vue';

const account = useAccount();
const { requireFeature, checkHistoryLimit, paywallVisible, paywallMinPlan, closePaywall } = useFeatureGate();

const isDev = import.meta.env?.DEV === true;
// DEV-only QA overlay (?qa=1). Must not ship in production bundles.
const qaEnabled = computed(() => {
  if (typeof window === 'undefined') return false;
  if (!import.meta.env?.DEV) return false;
  const qs = window.location.search || '';
  return new URLSearchParams(qs).get('qa') === '1' || qs.includes('qa=1');
});
const QAOverlayComp = import.meta.env?.DEV
  ? defineAsyncComponent(() => import('./components/dev/QAOverlay.vue'))
  : null;

// Sections & mode
const currentSection = ref('home');
const calcMode = ref('');
const quickStep = ref(1);

const quickTotalSteps = computed(() => userSettings.showClientQuick ? 3 : 2);
const quickLogicalStep = computed(() => userSettings.showClientQuick ? quickStep.value : Math.max(1, quickStep.value - 1));
const showWowBg = computed(() => currentSection.value === 'home' || (currentSection.value === 'metric' && !calcMode.value));
const appRootRef = ref(null);
const bottomNavRef = ref(null);
const graphicsWizardRef = ref(null);
const metricScrollRef = ref(null);
const historyScrollRef = ref(null);
const settingsScrollRef = ref(null);
const infoScrollRef = ref(null);
/** Settings accordion: all sections closed on entry. Use section id to toggle. */
const settingsOpenSection = ref(null);
const settingsSectionRefs = {};
function setSettingsSectionRef(id, el) {
  settingsSectionRefs[id] = el;
}
function toggleSettingsSection(id) {
  const wasOpen = settingsOpenSection.value === id;
  settingsOpenSection.value = wasOpen ? null : id;
  if (!wasOpen && id) {
    nextTick(() => {
      const el = settingsSectionRefs[id];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function scrollToTop(el) {
  if (!el?.scrollTo) return;
  el.scrollTo({ top: 0, behavior: 'auto' });
}

function scrollMetricToTop() {
  scrollToTop(metricScrollRef.value);
}

const { modalOpen: inputModalOpen, modalConfig: inputModalConfig, openInputModal, confirm: inputModalConfirm, cancel: inputModalCancel } = useInputModal();
provide('openInputModal', openInputModal);
const { modalOpen: selectModalOpen, modalConfig: selectModalConfig, openSelectModal, confirm: selectModalConfirm, cancel: selectModalCancel } = useSelectModal();
provide('openSelectModal', openSelectModal);
const presetsModalOpen = ref(false);
let footerResizeObserver = null;
const updateFooterHeight = () => {
  const root = appRootRef.value;
  const nav = bottomNavRef.value;
  if (!root || !nav) return;
  const h = Math.round(nav.getBoundingClientRect().height || 0);
  if (h > 0) root.style.setProperty('--app-footer-height', `${h}px`);
};

// Form (standard)
const form = reactive({
  shape: 'circle',
  sizeCode: null,
  repairCode: null,
  riskCode: null,
  materialCode: null,
  carClassCode: null,
  disassemblyCodes: ['Z0'],
  paintMaterialCode: null,
  soundInsulationCode: null
});

const estimateDraft = reactive({
  clientName: '',
  clientCompany: '',
  clientMood: null,
  clientPhone: '',
  carBrand: '',
  carModel: '',
  carPlate: '',
  inspectDate: '',
  inspectTime: '',
  element: null,
  sizeLengthMm: null,
  sizeWidthMm: null,
  comment: '',
  breakdown: [],
  quickDents: [],
  repairTimeHours: null,
  discountPercent: null,
  dentDiscounts: {},
  prepayment: { amount: 0, method: null },
  attachments: [],
  additionalWorks: [],
  masterName: ''
});

const { historyItems, loadHistory, saveEstimate, updateEstimate, deleteEstimate, clearHistory } = useHistoryStore();
const selectedHistoryId = ref(null);
const historyFinalTab = ref('calculation');

const { foundClient, searchByPhone, clearSearch } = useClientSearch(() => loadHistory());
const historyClientPhoneFilter = ref('');
const postSaveAnalytics = ref(null);

watch(() => estimateDraft.clientPhone, (phone) => {
  searchByPhone(phone ?? '');
}, { immediate: true });

function navigateToHistoryByClientPhone(payload) {
  const raw = payload && typeof payload === 'object' && payload.phone != null
    ? String(payload.phone)
    : String(estimateDraft.clientPhone || '');
  let phone = raw.trim();
  if (!phone && foundClient.value?.allRecords?.length) {
    const r = foundClient.value.allRecords[0];
    phone = String(r?.client?.phone ?? r?.clientPhone ?? '').trim();
  }
  const n = normalizePhone(phone);
  historyClientPhoneFilter.value = n.length >= 5 ? n : '';
  if (requireFeature('historyEnabled')) switchSection('history');
}

function openClientHistory(payload) {
  const fromCard =
    payload && typeof payload === 'object' && payload.phone != null
      ? String(payload.phone).trim()
      : '';
  if (fromCard) {
    navigateToHistoryByClientPhone({ phone: fromCard });
    return;
  }
  navigateToHistoryByClientPhone({ phone: estimateDraft.clientPhone });
}

function handleAutofillClient(fields) {
  if (!fields || typeof fields !== 'object') return;
  applyClientFields(estimateDraft, fields);
  showToast('Данные подставлены', 'success', 1200);
}

function openRecordFromSheet(record) {
  if (record?.id) {
    selectedHistoryId.value = record.id;
    switchSection('history');
  }
}
const selectedHistory = computed(() => historyItems.value.find((item) => item.id === selectedHistoryId.value) || null);

watch(selectedHistoryId, () => {
  historyFinalTab.value = 'calculation';
});

/** Группировка breakdown по вмятинам для отображения в истории: [{ dentNum, title, items }] */
const groupedHistoryBreakdown = computed(() => {
  const raw = selectedHistory.value?.breakdown || [];
  if (!raw.length) return [];
  const dentMap = new Map();
  for (const item of raw) {
    const m = item.name?.match(/^Вмятина\s+(\d+)(?:\s+\([^)]+\))?\s*·\s*(.+)$/);
    if (m) {
      const dentNum = Number(m[1]);
      const shortName = m[2].trim();
      if (!dentMap.has(dentNum)) dentMap.set(dentNum, []);
      dentMap.get(dentNum).push({ name: shortName, value: item.value });
    } else {
      if (!dentMap.has(0)) dentMap.set(0, []);
      dentMap.get(0).push({ name: item.name, value: item.value });
    }
  }
  const keys = [...dentMap.keys()].sort((a, b) => a - b);
  return keys.map((k) => ({
    dentNum: k,
    title: k === 0 ? 'Расчёт' : `Расчёт по вмятине ${k}`,
    items: dentMap.get(k) || []
  }));
});

/** Line items для истории — используем сохранённый snapshot при наличии, иначе fallback для старых записей. */
const historyLineItems = computed(() => {
  const h = selectedHistory.value;
  const dentItems = selectedHistoryDentItems.value;
  const discPct = clampDiscount(h?.discountPercent ?? 0);
  const roundStep = userSettings.priceRoundStep ?? 0;

  if (!dentItems?.length) return [];

  const snapshot = h?.lineItemsSnapshot;
  if (Array.isArray(snapshot) && snapshot.length > 0) {
    return snapshot.map((item) => {
      const dent = item.dent || {};
      const dentDisplay = {
        ...dent,
        conditions: dent.conditions || {},
        panelElement: dent.panelElement ?? '',
        sizeLengthMm: dent.sizeLengthMm ?? dent.bboxMm?.width,
        sizeWidthMm: dent.sizeWidthMm ?? dent.bboxMm?.height,
        bboxMm: dent.bboxMm ?? { width: dent.sizeLengthMm, height: dent.sizeWidthMm }
      };
      return {
        dent: dentDisplay,
        base: item.base ?? 0,
        breakdown: item.breakdown ?? [],
        appliedTotal: item.appliedTotal ?? item.base ?? 0,
        preDiscountTotal: item.preDiscountTotal ?? item.base ?? 0,
        discountPercent: item.discountPercent ?? discPct,
        discountAmount: item.discountAmount ?? 0
      };
    });
  }

  const ctx = {
    sizesWithArea: circleSizesWithArea,
    circleSizesWithArea,
    stripSizesWithArea,
    prices: userSettings.prices,
    initialData,
    roundStep: 0
  };

  const recomputed = [];
  for (let i = 0; i < dentItems.length; i++) {
    const d = dentItems[i];
    const bbox = d.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const hh = Number(bbox.height) || 0;
    if (w <= 0 || hh <= 0) break;
    const resolved = resolveDentShapeType(w, hh);
    const shape = resolved === 'stripe' ? 'strip' : 'circle';
    const conditions = userSettings.showPaintMaterial !== false
      ? (d.conditions || {})
      : { ...(d.conditions || {}), paintMaterialCode: null };
    const result = calcDentViaAdapter(
      { shape, widthMm: w, heightMm: hh, conditions, panelElement: d.panelElement || null },
      ctx
    );
    const mult = getPriceMultiplier(shape, userSettings);
    recomputed.push({
      id: d.id ?? `d${i}`,
      dent: d,
      base: (result.base || 0) * mult,
      total: (result.total || 0) * mult,
      breakdown: result.breakdown || []
    });
  }

  if (recomputed.length === 0) {
    const groups = groupedHistoryBreakdown.value.filter((g) => g.dentNum > 0);
    return groups.map((group, idx) => {
      const items = group.items || [];
      let baseItem = null;
      let totalItem = null;
      let discountItem = null;
      const paramItems = [];
      for (const item of items) {
        if (item.name === 'Базовая стоимость') baseItem = item;
        else if (item.name === 'Итог') totalItem = item;
        else if (item.name === 'Скидка') discountItem = item;
        else paramItems.push(item);
      }
      const base = baseItem ? parseInt(String(baseItem.value || '').replace(/\D/g, ''), 10) || 0 : 0;
      const appliedTotal = totalItem ? parseInt(String(totalItem.value || '').replace(/\D/g, ''), 10) || 0 : 0;
      let preDiscountTotal = appliedTotal;
      if (discountItem?.value) {
        const m = discountItem.value.match(/\(−?\s*(\d[\d\s]*)\s*₽\)/);
        if (m) preDiscountTotal = appliedTotal + (parseInt(m[1].replace(/\s/g, ''), 10) || 0);
        else if (discPct > 0 && appliedTotal > 0) preDiscountTotal = Math.round(appliedTotal / (1 - discPct / 100));
      }
      const dent = dentItems[idx] || {};
      const dentDisplay = { ...dent, conditions: dent.conditions || {}, panelElement: dent.panelElement || '', sizeLengthMm: dent.bboxMm?.width, sizeWidthMm: dent.bboxMm?.height };
      const subtotal = preDiscountTotal;
      const discountAmount = Math.round(subtotal * discPct / 100);
      const final = Math.max(0, subtotal - discountAmount);
      const applied = roundStep > 0 ? applyPriceRoundingCeil(final, roundStep) : Math.round(final);
      return { dent: dentDisplay, base, breakdown: paramItems, appliedTotal: applied, preDiscountTotal: subtotal, discountPercent: discPct, discountAmount };
    });
  }

  const dentItemsForRule = recomputed.map((r) => ({ total: r.total, panelElement: r.dent?.panelElement ?? null, dent: r.dent }));
  const { weightedTotals } = calculateSessionTotalWithMultiDentRule(dentItemsForRule, {
    discountSamePartEnabled: userSettings.discountSamePartEnabled,
    discountSamePartValue: userSettings.discountSamePartValue,
    discountDiffPartEnabled: userSettings.discountDiffPartEnabled,
    discountDiffPartValue: userSettings.discountDiffPartValue,
    enableSecondDentDiscount: userSettings.enableSecondDentDiscount,
    secondDentDiscountPercent: userSettings.secondDentDiscountPercent
  });

  const dentInputs = recomputed.map((r, idx) => {
    const dentPct = clampDiscount(r.dent?.discountPercent ?? discPct);
    return {
      id: r.id,
      basePrice: r.base,
      subtotal: weightedTotals[idx] ?? r.total,
      discountPercent: dentPct
    };
  });
  const totals = calculateEstimateTotals(dentInputs, 0);

  return recomputed.map((r, idx) => {
    const t = totals.dents[idx];
    const applied = roundStep > 0 ? applyPriceRoundingCeil(t?.final ?? 0, roundStep) : Math.round(t?.final ?? 0);
    const dentPct = clampDiscount(r.dent?.discountPercent ?? discPct);
    const dentDisplay = {
      ...r.dent,
      conditions: r.dent?.conditions || {},
      panelElement: r.dent?.panelElement || '',
      sizeLengthMm: r.dent?.bboxMm?.width,
      sizeWidthMm: r.dent?.bboxMm?.height
    };
    return {
      dent: dentDisplay,
      base: r.base,
      breakdown: r.breakdown,
      appliedTotal: applied,
      preDiscountTotal: t?.subtotal ?? r.total,
      discountPercent: dentPct,
      discountAmount: t?.discountAmount ?? 0
    };
  });
});

if (import.meta.env.DEV) {
  function assertPriceImmutability(record) {
    if (!record?.lineItemsSnapshot?.length) return;
    const storedSum = record.lineItemsSnapshot.reduce((s, i) => s + (i.appliedTotal ?? i.base ?? 0), 0);
    const savedTotal = Number(record.total ?? record.dmCalculatedPrice ?? 0);
    if (savedTotal > 0 && Math.abs(storedSum - savedTotal) > 100) {
      console.warn('[PRICE IMMUTABILITY] Record snapshot sum differs from saved total.', 'Stored sum:', storedSum, 'Saved total:', savedTotal, 'Record id:', record.id);
    }
  }
  watch(
    () => [historyItems.value, selectedHistoryId.value],
    () => {
      const rec = historyItems.value?.find((r) => r?.id === selectedHistoryId.value);
      if (rec) assertPriceImmutability(rec);
    },
    { immediate: true }
  );
}

/** Итог по истории: manual override > sum of line items > saved total. */
const historyDisplayTotal = computed(() => {
  const rec = selectedHistory.value;
  if (rec?.isPriceManuallyAdjusted && rec.manualAdjustedPrice != null) {
    return Number(rec.manualAdjustedPrice) || 0;
  }
  const items = historyLineItems.value;
  if (items?.length > 0) {
    const sum = items.reduce((s, i) => s + (i.appliedTotal ?? 0), 0);
    if (sum > 0) return sum;
  }
  return rec?.total ?? 0;
});

function historyBreakdownDeltaClass(value) {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('−') || value.startsWith('-')) return 'text-gray-500';
  return 'text-white';
}

function getHistoryDentPanelElement(dentNum) {
  const items = selectedHistoryDentItems.value;
  const idx = dentNum > 0 ? dentNum - 1 : 0;
  return items[idx]?.panelElement || '';
}

function getHistoryDentSizeLabel(dentNum) {
  const items = selectedHistoryDentItems.value;
  const idx = dentNum > 0 ? dentNum - 1 : 0;
  const d = items[idx];
  if (!d) return '';
  const shape = d.type === 'circle' || d.shape === 'circle' ? 'Круг/Овал' : 'Полоса';
  const bbox = d.bboxMm || {};
  const w = Number(bbox.width) || 0;
  const h = Number(bbox.height) || 0;
  if (!w && !h) return '';
  return `${shape} длина: ${formatSingleDim(w)}, Высота: ${formatSingleDim(h)}`;
}
const historyDetailTelHref = computed(() => {
  const raw = (selectedHistory.value?.client?.phone || '').replace(/\D/g, '');
  if (!raw) return '';
  if (raw.length >= 10 && (raw[0] === '8' || raw[0] === '7')) return '+7' + raw.slice(1);
  return '+' + raw;
});
const selectedHistoryDentItems = computed(() => {
  const h = selectedHistory.value;
  const items = h?.dents?.items;
  if (Array.isArray(items) && items.length) return items;
  // Back-compat for older quick entries saved as `quickDents`
  const q = h?.quickDents;
  if (!Array.isArray(q) || q.length === 0) return [];
  return q.map((d) => {
    const { widthMm: w, heightMm: hh } = normalizeDimensions(d.sizeLengthMm, d.sizeWidthMm);
    return {
      id: d.id,
      type: d.shape,
      sizeCode: d.sizeCode,
      bboxMm: { width: w, height: hh },
      panelSide: d.panelSide || 'left',
      panelElement: d.panelElement || null,
      conditions: d.conditions
    };
  });
});
const isSavingHistory = ref(false);
const toast = reactive({ visible: false, text: '', type: 'success', timeoutId: null, actionText: null, onAction: null });
const skipNextAutoFill = ref(false);
const isEditingHistory = ref(false);
const isUpdatingHistory = ref(false);
const historyEditDraft = reactive({
  clientName: '',
  clientCompany: '',
  clientPhone: '',
  carBrand: '',
  carModel: '',
  carPlate: '',
  inspectDate: '',
  inspectTime: '',
  comment: '',
  clientMood: null,
  prepayment: { amount: 0, method: null },
  discountPercent: 0,
  editManualPrice: null,
  attachments: []
});

/** Элементы только для стороны ВЕРХ (Капот, Крыша, Багажник) */
const TOP_ONLY_ELEMENTS = ['Капот', 'Крыша', 'Крышка багажника'];
const quickPartsTop = [...TOP_ONLY_ELEMENTS];
const quickPartsSide = [
  'Переднее крыло',
  'Передняя дверь',
  'Задняя дверь',
  'Заднее крыло',
  'Стойка крыши',
  'Порог',
  'Бампер'
];
const quickPartsLeft = [...quickPartsSide];
const quickPartsRight = [...quickPartsSide];

function getElementsForSide(side) {
  if (side === 'top') return quickPartsTop;
  return quickPartsSide;
}

// Quick Calc UI state (active damage)
const activeQuickDentId = ref(null);
const activeQuickDent = computed(() => {
  const list = estimateDraft.quickDents || [];
  if (list.length === 0) return null;
  const found = activeQuickDentId.value ? list.find((d) => d.id === activeQuickDentId.value) : null;
  return found || list[list.length - 1] || null;
});

function setActiveQuickDent(id) {
  if (!id) return;
  activeQuickDentId.value = id;
  nextTick(() => scrollMetricToTop());
}

const quickGeometryTab = ref('standard'); // 'standard' | 'custom'
const quickStandardSizePills = computed(() => {
  // Reference pills: "С МОНЕТУ", "10мм", "25мм", "100мм"
  // Map to existing ordered circle sizes to preserve underlying meaning.
  const circleCodes = (initialData.circleSizes || []).map((s) => s.code);
  const pick = [circleCodes[0], circleCodes[1], circleCodes[2], circleCodes[3]].filter(Boolean);
  const labels = ['С МОНЕТУ', '10мм', '25мм', '100мм'];
  return pick.map((code, idx) => ({ code, label: labels[idx] || code }));
});

const clientDataValid = computed(() => {
  if (!userSettings.clientRequired) return true;
  const name = String(estimateDraft.clientName || '').trim();
  const phone = String(estimateDraft.clientPhone || '').trim();
  const brand = String(estimateDraft.carBrand || '').trim();
  const model = String(estimateDraft.carModel || '').trim();
  if (userSettings.requireName && !name) return false;
  if (userSettings.requirePhone && !phone) return false;
  if (userSettings.requireCarBrandModel && (!brand || !model)) return false;
  return true;
});

function normalizePanelElement(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.includes(':')) {
    const [side, ...rest] = value.split(':');
    const s = side === 'top' ? 'top' : (side === 'right' ? 'right' : 'left');
    return { side: s, element: rest.join(':') };
  }
  return { side: 'left', element: String(value) };
}

function createQuickDent(panelElement = null) {
  const normalized = normalizePanelElement(panelElement);
  return {
    id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shape: 'circle',
    sizeInputMode: 'preset',
    sizeCode: null,
    sizeLengthMm: null,
    sizeWidthMm: null,
    panelSide: normalized?.side || 'left',
    panelElement: normalized?.element || null,
    discountPercent: null,
    conditions: {
      repairCode: null,
      riskCode: null,
      materialCode: null,
      carClassCode: null,
      disassemblyCodes: ['Z0'],
      paintMaterialCode: null,
      soundInsulationCode: null
    }
  };
}

function addQuickDent() {
  // New dent should be a clean card (no copied values).
  const next = createQuickDent(null);
  next.panelSide = getQuickDefaultSide();
  estimateDraft.quickDents.push(next);
  activeQuickDentId.value = next.id;
  haptic('selection');
}

function removeQuickDent(id) {
  estimateDraft.quickDents = estimateDraft.quickDents.filter((d) => d.id !== id);
  haptic('selection');
}

function removeActiveQuickDent() {
  if (!activeQuickDent.value?.id) return;
  if (estimateDraft.quickDents.length <= 1) return;
  const removedId = activeQuickDent.value.id;
  const idx = estimateDraft.quickDents.findIndex((d) => d.id === removedId);
  removeQuickDent(removedId);
  const remaining = estimateDraft.quickDents;
  if (remaining.length > 0) {
    const nextIdx = Math.min(idx, remaining.length - 1);
    activeQuickDentId.value = remaining[nextIdx].id;
  } else {
    activeQuickDentId.value = null;
  }
}

/** Сброс значений выбранной вмятины до начального вида. Остальные вмятины не трогаются. */
function resetQuickDentsValues() {
  const dent = activeQuickDent.value;
  if (!dent) return;
  dent.shape = 'circle';
  dent.sizeInputMode = 'preset';
  dent.sizeCode = null;
  dent.sizeLengthMm = null;
  dent.sizeWidthMm = null;
  dent.panelSide = 'left';
  dent.panelElement = null;
  if (dent.conditions) {
    dent.conditions.repairCode = null;
    dent.conditions.riskCode = null;
    dent.conditions.materialCode = null;
    dent.conditions.carClassCode = null;
    dent.conditions.disassemblyCodes = ['Z0'];
    dent.conditions.paintMaterialCode = null;
    dent.conditions.soundInsulationCode = null;
  }
  haptic('selection');
}

function setQuickDentShape(dent, shape) {
  dent.shape = shape;
  dent.sizeCode = null;
  dent.sizeLengthMm = null;
  dent.sizeWidthMm = null;
  haptic('selection');
}

function getQuickDefaultPanel() {
  const last = estimateDraft.quickDents[estimateDraft.quickDents.length - 1];
  if (last?.panelElement) return { side: last.panelSide || 'left', element: last.panelElement };
  const side = last?.panelSide === 'top' ? 'top' : (last?.panelSide === 'right' ? 'right' : 'left');
  const list = getElementsForSide(side);
  return { side, element: list.length ? list[0] : null };
}

function getQuickDefaultSide() {
  const last = estimateDraft.quickDents[estimateDraft.quickDents.length - 1];
  if (last?.panelSide === 'top') return 'top';
  return last?.panelSide === 'right' ? 'right' : 'left';
}

function onQuickDentElementChange(dent) {
  if (dent?.panelElement && !dent.panelSide) dent.panelSide = 'left';
  if (dent?.conditions?.disassemblyCodes && dent.panelElement) {
    const works = getArmaturnayaWorksForElement(dent.panelElement);
    const validCodes = new Set(works.map((w) => w.code));
    const cur = normalizeArmatureWorkIds(dent.conditions.disassemblyCodes);
    const next = normalizeArmatureWorkIds(cur.filter((c) => validCodes.has(c)));
    dent.conditions.disassemblyCodes = next;
  }
  haptic('selection');
}

function onArmaturnayaSelect(dent, code) {
  dent.conditions.disassemblyCodes = normalizeArmatureWorkIds(code ? [code] : []);
  haptic('selection');
}

function setQuickDentSide(dent, side) {
  if (!dent) return;
  const newSide = side === 'top' ? 'top' : (side === 'right' ? 'right' : 'left');
  if (dent.panelSide === newSide) return;
  const availableForNew = getElementsForSide(newSide);
  const currentElementAvailable = dent.panelElement && availableForNew.includes(dent.panelElement);
  dent.panelSide = newSide;
  if (!currentElementAvailable && dent.panelElement) {
    dent.panelElement = null;
    showToast('Выберите элемент для этой стороны');
  }
  haptic('selection');
}

function normalizeQuickDentPanel(dent) {
  if (!dent) return;
  if (dent.panelElement && typeof dent.panelElement === 'string' && dent.panelElement.includes(':')) {
    const parsed = normalizePanelElement(dent.panelElement);
    dent.panelSide = parsed?.side || dent.panelSide || 'left';
    dent.panelElement = parsed?.element || null;
  }
  if (!dent.panelSide) dent.panelSide = 'left';
}

function getSizeListForShape(shape) {
  return shape === 'circle' ? initialData.circleSizes : initialData.stripSizes;
}

function syncQuickDentMmFromSizeCode(dent) {
  if (!dent.sizeCode) return;
  const size = circleSizesMm.find((s) => s.code === dent.sizeCode) || stripSizesMm.find((s) => s.code === dent.sizeCode);
  if (!size?.mm) return;
  dent.sizeLengthMm = size.mm.w;
  dent.sizeWidthMm = size.mm.h;
}

function onQuickDentSizeCodeChange(dent) {
  syncQuickDentMmFromSizeCode(dent);
  syncQuickDentSizeFromMm(dent);
  haptic('selection');
}

function syncQuickDentSizeFromMm(dent) {
  const l = Number(dent.sizeLengthMm) || 0;
  const w = Number(dent.sizeWidthMm) || 0;
  if (l > 0 && w > 0) {
    const resolved = resolveDentShapeType(l, w);
    const shapeForCode = resolved === 'stripe' ? 'strip' : 'circle';
    const sizeCode = getSizeCodeFromMm(shapeForCode, dent.sizeLengthMm, dent.sizeWidthMm);
    if (sizeCode) dent.sizeCode = sizeCode;
  }
}

function ensureInspectDateTime() {
  if (skipNextAutoFill.value) {
    skipNextAutoFill.value = false;
    return;
  }
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  if (!estimateDraft.inspectDate) {
    estimateDraft.inspectDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  if (!estimateDraft.inspectTime) {
    estimateDraft.inspectTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}
ensureInspectDateTime();

// User settings
const buildDefaultPrices = () => {
  const p = {};
  initialData.circleSizes.forEach(s => { p[s.code] = s.basePrice; });
  initialData.stripSizes.forEach(s => { p[s.code] = s.basePrice; });
  return p;
};

const userSettings = reactive({
  prices: buildDefaultPrices(),
  masters: JSON.parse(JSON.stringify(initialData.defaultMasters)),
  hourlyRate: 0,
  clientRequired: false,
  showClientQuick: true,
  showClientDetail: true,
  requirePhone: true,
  requireName: true,
  requireCarBrandModel: false,
  autoSaveHistory: false,
  showInfoTooltips: true,
  priceRoundStep: 0,
  sizeUnit: 'mm',
  showRepairTime: true,
  showPaintMaterial: true,
  showSoundInsulation: true,
  enableSecondDentDiscount: false,
  secondDentDiscountPercent: 50,
  discountSamePartEnabled: false,
  discountSamePartValue: 50,
  discountDiffPartEnabled: false,
  discountDiffPartValue: 0,
  priceAdjustmentRoundOval: 1.0,
  priceAdjustmentStripe: 1.0,
  useQuickUiInDetail: true,
  customArmatureWorks: [],
  armaturePriceOverrides: {}
});

function loadUserSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
    const v5 = localStorage.getItem('dentRepairSettings_v5');
    const p = (typeof raw === 'object' && raw !== null && (raw.prices || raw.clientRequired != null))
      ? raw
      : (v5 ? JSON.parse(v5) : null) || {};
    const migrated = migrateSettings(p);
    if (p.prices) Object.assign(userSettings.prices, p.prices);
    if (p.masters) userSettings.masters = p.masters;
    if (typeof p.clientRequired === 'boolean') userSettings.clientRequired = p.clientRequired;
    if (typeof p.showClientQuick === 'boolean') userSettings.showClientQuick = p.showClientQuick;
    if (typeof p.showClientDetail === 'boolean') userSettings.showClientDetail = p.showClientDetail;
    if (typeof p.requirePhone === 'boolean') userSettings.requirePhone = p.requirePhone;
    if (typeof p.requireName === 'boolean') userSettings.requireName = p.requireName;
    if (typeof p.requireCarBrandModel === 'boolean') userSettings.requireCarBrandModel = p.requireCarBrandModel;
    if (typeof p.autoSaveHistory === 'boolean') userSettings.autoSaveHistory = p.autoSaveHistory;
    if (typeof p.showInfoTooltips === 'boolean') userSettings.showInfoTooltips = p.showInfoTooltips;
    if (typeof p.priceRoundStep === 'number' && PRICE_ROUND_OPTIONS.some((o) => o.value === p.priceRoundStep)) userSettings.priceRoundStep = p.priceRoundStep;
    if (p.sizeUnit === 'cm' || p.sizeUnit === 'mm') userSettings.sizeUnit = p.sizeUnit;
    if (typeof p.showRepairTime === 'boolean') userSettings.showRepairTime = p.showRepairTime;
    if (typeof p.showPaintMaterial === 'boolean') userSettings.showPaintMaterial = p.showPaintMaterial;
    if (typeof p.showSoundInsulation === 'boolean') userSettings.showSoundInsulation = p.showSoundInsulation;
    if (typeof p.enableSecondDentDiscount === 'boolean') userSettings.enableSecondDentDiscount = p.enableSecondDentDiscount;
    if (typeof p.secondDentDiscountPercent === 'number' && p.secondDentDiscountPercent >= 0 && p.secondDentDiscountPercent <= 100) userSettings.secondDentDiscountPercent = p.secondDentDiscountPercent;
    if (typeof p.useQuickUiInDetail === 'boolean') userSettings.useQuickUiInDetail = p.useQuickUiInDetail;
    if (Array.isArray(p.customArmatureWorks)) userSettings.customArmatureWorks = p.customArmatureWorks;
    if (p.armaturePriceOverrides && typeof p.armaturePriceOverrides === 'object') userSettings.armaturePriceOverrides = p.armaturePriceOverrides;
    userSettings.priceAdjustmentRoundOval = migrated.priceAdjustmentRoundOval ?? 1.0;
    userSettings.priceAdjustmentStripe = migrated.priceAdjustmentStripe ?? 1.0;
    userSettings.discountSamePartEnabled = migrated.discountSamePartEnabled ?? false;
    userSettings.discountSamePartValue = migrated.discountSamePartValue ?? 50;
    userSettings.discountDiffPartEnabled = migrated.discountDiffPartEnabled ?? false;
    userSettings.discountDiffPartValue = migrated.discountDiffPartValue ?? 0;
    const validated = validateSettings({ ...userSettings });
    userSettings.priceAdjustmentRoundOval = validated.priceAdjustmentRoundOval;
    userSettings.priceAdjustmentStripe = validated.priceAdjustmentStripe;
    userSettings.discountSamePartValue = validated.discountSamePartValue;
    userSettings.discountDiffPartValue = validated.discountDiffPartValue;
  } catch (e) {
    if (import.meta.env?.DEV) console.error('Failed to load settings', e);
  }
}
loadUserSettings();

const metricScrollPaddingBottom = computed(() => {
  const footer = 'var(--app-footer-height,64px)';
  const safe = 'env(safe-area-inset-bottom,0px)';
  if (calcMode.value === 'standard') {
    const isStep2 = quickStep.value === 2 || (quickStep.value === 1 && !userSettings.showClientQuick);
    return isStep2
      ? `calc(${footer} + ${safe} + 56px)`
      : `calc(${footer} + ${safe} + 100px)`;
  }
  return `calc(${footer} + ${safe} + 1rem)`;
});

/** Эффективный множитель цен Круг/Овал: среднее отношение текущих цен к базовым (initialData). */
const effectivePriceMultiplierRoundOval = computed(() => {
  const sizes = initialData.circleSizes;
  let sumRatio = 0;
  let count = 0;
  for (const s of sizes) {
    const base = Number(s.basePrice);
    const current = Number(userSettings.prices[s.code]);
    if (base > 0 && Number.isFinite(current)) {
      sumRatio += current / base;
      count++;
    }
  }
  return count === 0 ? 100 : Math.round((sumRatio / count) * 100);
});

/** Эффективный множитель цен Полоса/Царапина: среднее отношение текущих цен к базовым (initialData). */
const effectivePriceMultiplierStripe = computed(() => {
  const sizes = initialData.stripSizes;
  let sumRatio = 0;
  let count = 0;
  for (const s of sizes) {
    const base = Number(s.basePrice);
    const current = Number(userSettings.prices[s.code]);
    if (base > 0 && Number.isFinite(current)) {
      sumRatio += current / base;
      count++;
    }
  }
  return count === 0 ? 100 : Math.round((sumRatio / count) * 100);
});

// Graphics state
const graphicsState = reactive({
  selectedClass: null,
  selectedPart: null,
  dents: []
});

const graphicsData = {
  carClasses: [
    { id: 'sedan', name: 'Седан', icon: '🚗' },
    { id: 'crossover', name: 'Кроссовер', icon: '🚙' },
    { id: 'suv', name: 'Внедорожник', icon: '🚜' }
  ]
};

/** Список деталей для выбранного класса (для dropdown). */
const graphicsPartsList = computed(() => {
  if (graphicsState.selectedClass?.id === 'crossover') {
    return getPartsByClass('crossover');
  }
  return Object.values(CAR_PARTS);
});

const graphicsSelectedClassId = ref('crossover');
const graphicsSelectedPartId = ref('hood');

watch(
  () => [graphicsState.selectedClass, graphicsState.selectedPart],
  () => {
    if (graphicsState.selectedClass) graphicsSelectedClassId.value = graphicsState.selectedClass.id;
    if (graphicsState.selectedPart) graphicsSelectedPartId.value = graphicsState.selectedPart.id;
  },
  { immediate: true }
);

watch([graphicsSelectedClassId, graphicsSelectedPartId], () => {
  ensureGraphicsSelection();
}, { immediate: true });

watch(
  () => graphicsState.selectedPart,
  (part) => {
    if (part?.name) estimateDraft.element = part.name;
  },
  { immediate: true }
);

function ensureGraphicsSelection() {
  const classId = graphicsSelectedClassId.value || graphicsData.carClasses[0]?.id;
  const cls = graphicsData.carClasses.find((c) => c.id === classId) || graphicsData.carClasses[0];
  graphicsState.selectedClass = cls || null;
  const list = cls?.id === 'crossover' ? getPartsByClass('crossover') : Object.values(CAR_PARTS);
  const partId = graphicsSelectedPartId.value;
  let part = list.find((p) => p.id === partId);
  if (!part) part = list[0] || null;
  graphicsState.selectedPart = part;
  if (part) graphicsSelectedPartId.value = part.id;
  if (cls) graphicsSelectedClassId.value = cls.id;
}

// Computed

/** В графике для круга: мм-размеры для кроссовера (капот, двери, крыло), иначе legacy */
const graphicsCircleSizes = computed(() => {
  const part = graphicsState.selectedPart;
  if (part?.realSizeMm && part?.asset?.type === 'image') {
    return circleSizesWithArea;
  }
  return initialData.circleSizes;
});

/** В графике для полосы: мм-размеры для кроссовера — единая механика как на капоте */
const graphicsStripSizes = computed(() => {
  const part = graphicsState.selectedPart;
  if (part?.realSizeMm && part?.asset?.type === 'image') {
    return stripSizesWithArea;
  }
  return initialData.stripSizes;
});

const quickDentTotals = computed(() => estimateDraft.quickDents.map((dent) => {
  const w = Number(dent.sizeLengthMm) || 0;
  const h = Number(dent.sizeWidthMm) || 0;
  const resolved = resolveDentShapeType(w, h);
  const shape = resolved === 'stripe' ? 'strip' : 'circle';
  const ctx = {
    sizesWithArea: shape === 'circle' ? circleSizesWithArea : stripSizesWithArea,
    circleSizesWithArea,
    stripSizesWithArea,
    prices: userSettings.prices,
    initialData,
    roundStep: userSettings.priceRoundStep ?? 0
  };
  const conditions = dent.conditions || {};
  const conditionsForCalc = userSettings.showPaintMaterial
    ? conditions
    : { ...conditions, paintMaterialCode: null };
  const result = calcDentViaAdapter(
    { shape, widthMm: w, heightMm: h, conditions: conditionsForCalc, panelElement: dent.panelElement },
    ctx
  );
  const mult = getPriceMultiplier(shape, userSettings);
  return {
    dent,
    sizeCode: result.sizeCode,
    base: result.base * mult,
    total: result.total * mult,
    breakdown: result.breakdown
  };
}));

const quickLineItems = computed(() => {
  const list = quickDentTotals.value.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
  if (list.length === 0) return [];
  const dentItems = list.map((d) => ({ total: d.total, panelElement: d.dent?.panelElement ?? null, dent: d.dent }));
  const { weightedTotals } = calculateSessionTotalWithMultiDentRule(dentItems, {
    discountSamePartEnabled: userSettings.discountSamePartEnabled,
    discountSamePartValue: userSettings.discountSamePartValue,
    discountDiffPartEnabled: userSettings.discountDiffPartEnabled,
    discountDiffPartValue: userSettings.discountDiffPartValue,
    enableSecondDentDiscount: userSettings.enableSecondDentDiscount,
    secondDentDiscountPercent: userSettings.secondDentDiscountPercent
  });
  const roundStep = userSettings.priceRoundStep ?? 0;
  const dentInputs = list.map((item, idx) => {
    const dentPct = clampDiscount(item.dent?.discountPercent ?? estimateDraft.discountPercent ?? 0);
    return {
      id: item.dent?.id ?? `d${idx}`,
      basePrice: item.base ?? 0,
      subtotal: weightedTotals[idx] ?? item.total,
      discountPercent: dentPct
    };
  });
  const totals = calculateEstimateTotals(dentInputs, 0);
  return list.map((item, idx) => {
    const t = totals.dents[idx];
    const applied = roundStep > 0
      ? applyPriceRoundingCeil(t?.final ?? 0, roundStep)
      : Math.round(t?.final ?? 0);
    const dentPct = clampDiscount(item.dent?.discountPercent ?? estimateDraft.discountPercent ?? 0);
    return {
      ...item,
      appliedTotal: applied,
      rawDiscounted: t?.final ?? 0,
      preDiscountTotal: t?.subtotal ?? 0,
      discount: idx > 0,
      discountPercent: dentPct,
      discountAmount: t?.discountAmount ?? 0
    };
  });
});

const quickTotal = computed(() => {
  if (quickLineItems.value.length === 0) return 0;
  return quickLineItems.value.reduce((acc, item) => acc + item.rawDiscounted, 0);
});

/** Итого по всем повреждениям для экрана объяснения цен (Quick step 3). */
const quickGrandTotal = computed(() =>
  quickLineItems.value.reduce((sum, d) => sum + (d.appliedTotal ?? d.total ?? 0), 0)
);

/** Сумма по строкам расчёта DentMetric (без ручной корректировки строк и без доп. работ). */
const quickDmDentSubtotal = computed(() =>
  quickLineItems.value.reduce((sum, d) => sum + (d.appliedTotal ?? d.total ?? 0), 0)
);

function quickEffectiveDentLineTotal(item) {
  const dent = item.dent;
  const step = userSettings.priceRoundStep ?? 0;
  const rawM = dent?.manualLineTotal;
  if (rawM != null && rawM !== '' && Number.isFinite(Number(rawM))) {
    return applyPriceRoundingCeil(Number(rawM), step);
  }
  return item.appliedTotal ?? item.total ?? 0;
}

/** Итог к оплате на шаге 3: эффективные суммы по вмятинам + доп. работы. */
const quickWorksheetGrandTotal = computed(() => {
  let s = 0;
  for (const item of quickLineItems.value) {
    s += quickEffectiveDentLineTotal(item);
  }
  for (const w of estimateDraft.additionalWorks || []) {
    s += Number(w.price) || 0;
  }
  return s;
});

/** Клиент для ClientInfoBlock на Quick step 3. */
const quickClientForDisplay = computed(() => ({
  name: estimateDraft.clientName || '',
  phone: estimateDraft.clientPhone || '',
  brand: estimateDraft.carBrand || '',
  model: estimateDraft.carModel || '',
  company: estimateDraft.clientCompany || ''
}));

/** Нормализованные вмятины для расчёта (устраняет расхождения Quick vs Detail). */
const graphicsDentsForPricing = computed(() => {
  const ctx = {
    circleSizes: graphicsCircleSizes.value,
    stripSizes: stripSizesWithArea,
    prices: userSettings.prices,
    initialData,
    conditions: graphicsConditions.value
  };
  const normalized = normalizeGraphicsDentsForPricing(graphicsState.dents || [], ctx);
  return normalized.map((d) => {
    const mult = getPriceMultiplier(d.type || 'circle', userSettings);
    return { ...d, price: (d.price || 0) * mult };
  });
});

/** База от вмятин: сумма базовых цен (каждая вмятина отдельно). Единый источник: priceCalc.calcBasePriceFromDents. */
const graphicsBasePrice = computed(() => calcBasePriceFromDents(graphicsDentsForPricing.value));

/** Условия для графика: подставляем disassemblyCost из арматурных работ по выбранному элементу. */
const graphicsConditions = computed(() => {
  const base = { ...form };
  const codes = Array.isArray(form.disassemblyCodes) ? form.disassemblyCodes.filter(Boolean) : [];
  if (codes.length && graphicsState.selectedPart?.name) {
    let normalized = codes.length ? [...new Set(codes)] : ['Z0'];
    if (normalized.length === 0) normalized = ['Z0'];
    if (normalized.includes('Z0') && normalized.length > 1) normalized = normalized.filter((c) => c !== 'Z0');
    base.disassemblyCost = getArmaturnayaTotalPrice(normalized, graphicsState.selectedPart.name);
  }
  return base;
});

/** Итоговая цена в Графике: каждая вмятина отдельно, затем сумма. Единый источник: priceCalc.calcTotalPrice. */
const graphicsRawPrice = computed(() =>
  calcTotalPrice(graphicsDentsForPricing.value, graphicsConditions.value, initialData, userSettings.priceRoundStep ?? 0)
);
const graphicsPrice = computed(() =>
  applyDiscount(graphicsRawPrice.value, clampDiscount(estimateDraft.discountPercent))
);

const totalPrice = computed(() => {
  if (currentSection.value !== 'metric') return 0;
  if (calcMode.value === 'standard') {
    if (quickStep.value >= 3) return quickWorksheetGrandTotal.value;
    return quickTotal.value;
  }
  if (calcMode.value === 'graphics') {
    const wt = graphicsWizardRef.value?.totalPrice;
    const wizardTotal = wt != null && typeof wt === 'object' && 'value' in wt ? wt.value : wt;
    if (typeof wizardTotal === 'number') return wizardTotal;
    return graphicsPrice.value;
  }
  return 0;
});

/** Display total with optional rounding (presentation layer). */
const displayTotal = computed(() =>
  applyPriceRoundingCeil(totalPrice.value, userSettings.priceRoundStep)
);

/** Цена только текущей активной вмятины (для ПРЕДВАРИТЕЛЬНАЯ СТОИМОСТЬ на шагах 1–2). */
const quickCurrentDentPrice = computed(() => {
  const id = activeQuickDentId.value;
  if (!id) return 0;
  const item = quickLineItems.value.find((i) => i.dent?.id === id);
  return item?.appliedTotal ?? 0;
});

/** Анимированная цена для nav-bar (Quick only). На шагах 1–2 — цена текущей карточки, на step 3 — не показывается. */
const quickPreliminaryPrice = computed(() => {
  if (calcMode.value !== 'standard') return 0;
  if (quickStep.value >= 3) return 0; // Step 3: своя панель без цены
  return quickCurrentDentPrice.value;
});
const animatedQuickPrice = useAnimatedNumber(quickPreliminaryPrice, 300, 80);

/** Estimated repair time in hours, updates in real-time from total price and hourly rate. */
const estimatedRepairTime = computed(() => {
  const total = displayTotal.value;
  const rate = userSettings.hourlyRate > 0 ? userSettings.hourlyRate : 4000;
  if (total <= 0 || rate <= 0) return '—';
  const hours = total / rate;
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} мин`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
});

const multiDentDiscountLabel = computed(() => {
  if (userSettings.discountSamePartEnabled) return `${userSettings.discountSamePartValue}%`;
  if (userSettings.discountDiffPartEnabled) return `${userSettings.discountDiffPartValue}% (др. элем.)`;
  if (userSettings.enableSecondDentDiscount) return `${userSettings.secondDentDiscountPercent}%`;
  return '50%';
});

const quickBreakdownItems = computed(() => {
  const result = [];
  quickLineItems.value.forEach((item, idx) => {
    const dentLabel = `Вмятина ${idx + 1}${item.discount ? ` (${multiDentDiscountLabel.value})` : ''}`;
    const lines = item.breakdown || [];
    lines.forEach((line) => {
      result.push({ name: `${dentLabel} · ${line.name}`, value: line.value });
    });
    if (item.discountPercent > 0) {
      result.push({
        name: `${dentLabel} · Скидка`,
        value: `−${item.discountPercent}% (−${formatCurrency(item.discountAmount ?? (item.preDiscountTotal - item.appliedTotal))} ₽)`
      });
    }
    result.push({
      name: `${dentLabel} · Итог`,
      value: `${formatCurrency(item.appliedTotal)} ₽`
    });
  });
  return result;
});

const quickStep2Valid = computed(() => {
  if (estimateDraft.quickDents.length === 0) return false;
  return estimateDraft.quickDents.every((d) =>
    d.panelElement &&
    d.sizeCode &&
    d.conditions?.repairCode &&
    d.conditions?.riskCode &&
    d.conditions?.materialCode &&
    d.conditions?.carClassCode &&
    (d.conditions?.disassemblyCodes?.length ?? 0) > 0
  );
});

const quickStep3Ready = computed(() => quickWorksheetGrandTotal.value > 0);

const getQuickDentTotal = (dentId) => {
  const item = quickDentTotals.value.find((d) => d.dent.id === dentId);
  return item?.total || 0;
};

const getQuickDentLabel = (dent) => {
  const l = Number(dent?.sizeLengthMm) || 0;
  const w = Number(dent?.sizeWidthMm) || 0;
  if (l > 0 && w > 0) {
    return resolveDentShapeType(l, w) === 'stripe' ? 'Полоса' : 'Круг/Овал';
  }
  return dent?.shape === 'circle' ? 'Круг/Овал' : 'Полоса';
};
const getHistoryDentLabel = (dent) => {
  const l = Number(dent?.sizeLengthMm ?? dent?.bboxMm?.width) || 0;
  const w = Number(dent?.sizeWidthMm ?? dent?.bboxMm?.height) || 0;
  if (l > 0 && w > 0) {
    return resolveDentShapeType(l, w) === 'stripe' ? 'Полоса' : 'Круг/Овал';
  }
  return dent?.type === 'circle' || dent?.shape === 'circle' ? 'Круг/Овал' : 'Полоса';
};

// Helpers
const formatCurrency = (v) => new Intl.NumberFormat('ru-RU').format(v);
const formatRoundedPrice = (raw) =>
  formatCurrency(applyPriceRoundingCeil(raw, userSettings.priceRoundStep));
const formatSingleDim = (mm) => {
  const v = Number(mm) || 0;
  if (userSettings.sizeUnit === 'cm') return `${(v / 10).toFixed(1)}см`;
  return `${v.toFixed(0)}мм`;
};
const formatSizeDisplay = (lengthMm, widthMm) => {
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  if (userSettings.sizeUnit === 'cm') {
    return `${(l / 10).toFixed(1)}×${(w / 10).toFixed(1)} см`;
  }
  return `${l.toFixed(1)}×${w.toFixed(1)} мм`;
};

const getRepairLabel = (code) => initialData.repairTypes.find((r) => r.code === code)?.name || '';
const getRiskLabel = (code) => initialData.risks.find((r) => r.code === code)?.name || '';
const getMaterialLabel = (code) => initialData.materials.find((m) => m.code === code)?.name || '';
const getCarClassLabel = (code) => initialData.carClasses.find((c) => c.code === code)?.name || '';
const getPaintMaterialLabel = (code) => initialData.paintMaterials?.find((p) => p.code === code)?.name || '';
const getSoundInsulationLabel = (code) => initialData.soundInsulation?.find((s) => s.code === code)?.name || '';

function buildDetailedBreakdown(dentItem) {
  return buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary);
}

function formatDelta(delta) {
  if (!delta || delta === 0) return '0 ₽';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ru-RU').format(delta)} ₽`;
}

function deltaClass(delta) {
  if (delta > 0) return 'text-white';
  return 'text-gray-500';
}

async function openDiscountModal(dent) {
  const currentVal = dent ? (dent.discountPercent ?? '') : (estimateDraft.discountPercent ?? '');
  const value = await openInputModal({
    title: 'Скидка',
    label: dent ? `Скидка для вмятины (%)` : 'Скидка (%)',
    value: currentVal,
    inputType: 'number',
    placeholder: '0',
    min: 0,
    max: 100
  });
  if (value === undefined) return;
  if (dent) {
    dent.discountPercent = (value === '' || value === null) ? null : clampDiscount(value);
  } else {
    if (value === '' || value === null) {
      estimateDraft.discountPercent = null;
      return;
    }
    estimateDraft.discountPercent = clampDiscount(value);
  }
}

async function openDiscountSamePartModal() {
  const value = await openInputModal({
    title: 'Скидка (один элемент)',
    label: 'Скидка (%)',
    value: userSettings.discountSamePartValue ?? 50,
    inputType: 'number',
    placeholder: '50',
    min: 0,
    max: 100
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    userSettings.discountSamePartValue = Math.max(0, Math.min(100, Number(value)));
  }
}

async function openDiscountDiffPartModal() {
  const value = await openInputModal({
    title: 'Скидка (другой элемент)',
    label: 'Скидка (%)',
    value: userSettings.discountDiffPartValue ?? 0,
    inputType: 'number',
    placeholder: '0',
    min: 0,
    max: 100
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    userSettings.discountDiffPartValue = Math.max(0, Math.min(100, Number(value)));
  }
}

async function openSecondDentDiscountModal() {
  const value = await openInputModal({
    title: 'Скидка на 2-ю вмятину',
    label: 'Размер скидки (%)',
    value: userSettings.secondDentDiscountPercent ?? 50,
    inputType: 'number',
    placeholder: '50',
    min: 0,
    max: 100
  });
  if (value === undefined) return;
  const n = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  userSettings.secondDentDiscountPercent = n;
}

async function openQuickPanelElementPicker(dent) {
  if (!dent) return;
  const list = getElementsForSide(dent.panelSide ?? 'left') || [];
  const selected = await openSelectModal({
    title: 'Поврежденный элемент',
    options: list.map((p) => ({ value: p, label: p })),
    value: dent.panelElement ?? null
  });
  if (selected === undefined) return;
  dent.panelElement = selected || null;
  onQuickDentElementChange(dent);
}

async function openQuickParamPicker(dent, field, title, options) {
  if (!dent?.conditions) return;
  const current = dent.conditions[field] ?? null;
  const selected = await openSelectModal({
    title,
    options: (options || []).map((o) => ({ value: o.code, label: o.name })),
    value: current
  });
  if (selected === undefined) return;
  dent.conditions[field] = selected || null;
  haptic('selection');
}

async function openQuickPaintPicker(dent) {
  if (!dent?.conditions) return;
  const selected = await openSelectModal({
    title: 'Материал ЛКП',
    options: (initialData.paintMaterials || []).map((p) => ({ value: p.code, label: p.name, subtitle: p.desc })),
    value: dent.conditions.paintMaterialCode ?? null
  });
  if (selected === undefined) return;
  dent.conditions.paintMaterialCode = selected || null;
  haptic('selection');
}

async function openQuickSoundPicker(dent) {
  if (!dent?.conditions) return;
  const selected = await openSelectModal({
    title: 'Шумоизоляция',
    options: (initialData.soundInsulation || []).map((s) => ({
      value: s.code,
      label: s.name,
      subtitle: s.desc,
      rightText: s.price > 0 ? `${s.price.toLocaleString('ru-RU')} ₽` : ''
    })),
    value: dent.conditions.soundInsulationCode ?? null
  });
  if (selected === undefined) return;
  dent.conditions.soundInsulationCode = selected || null;
  haptic('selection');
}

async function openQuickArmaturnayaPicker(dent) {
  if (!dent?.conditions) return;
  const works = getArmaturnayaWorksForElement(dent.panelElement);
  const cur = normalizeArmatureWorkIds(dent.conditions.disassemblyCodes);
  const selected = await openSelectModal({
    title: 'Арматурные работы',
    multiple: true,
    toggleMultipleValue: (current, toggled) => toggleArmatureWorkIds(current, toggled),
    options: works.map((w) => ({
      value: w.code,
      label: w.name,
      rightText: w.price > 0 ? `${w.price.toLocaleString('ru-RU')} ₽` : ''
    })),
    value: cur
  });
  if (selected === undefined) return;
  dent.conditions.disassemblyCodes = normalizeArmatureWorkIds(selected);
  haptic('selection');
}

async function openQuickCustomSize(dent) {
  if (!dent) return;
  dent.sizeInputMode = 'manual';
  const l = await openQuickDentSizeModal(dent, 'sizeLengthMm', 'Длина (мм)');
  if (l === undefined) return;
  const w = await openQuickDentSizeModal(dent, 'sizeWidthMm', 'Высота (мм)');
  if (w === undefined) return;
}

async function openQuickManualSize(dent) {
  if (!dent) return;
  dent.sizeInputMode = 'manual';
  // Keep preset pills unselected when user inputs dimensions.
  dent.sizeCode = null;
  const w = await openQuickDentSizeModal(dent, 'sizeLengthMm', 'Длина (мм)');
  if (w === undefined) return;
  const h = await openQuickDentSizeModal(dent, 'sizeWidthMm', 'Высота (мм)');
  if (h === undefined) return;
}

function applyDamagePreset(dent, preset) {
  if (!dent || !preset) return;
  const shape = preset.group === 'stripe' ? 'strip' : 'circle';
  dent.shape = shape;
  dent.sizeCode = null;
  dent.sizeLengthMm = preset.widthMm;
  dent.sizeWidthMm = preset.heightMm;
  dent.sizeInputMode = 'preset';
  syncQuickDentSizeFromMm(dent);
  haptic('selection');
}

function onPresetSelected(preset) {
  const dent = activeQuickDent.value;
  if (dent) applyDamagePreset(dent, preset);
}

function getQuickDetectedShapeLabel(dent) {
  const w = Number(dent?.sizeLengthMm) || 0;
  const h = Number(dent?.sizeWidthMm) || 0;
  return getResolvedShapeDisplayLabel(w, h);
}
const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
};

if (import.meta.env?.DEV) {
  window.__comparePricing = (shape, widthMm, heightMm, conditions) => {
    const sizes = shape === 'circle' ? circleSizesWithArea : stripSizesWithArea;
    const ctx = { sizesWithArea: sizes, prices: userSettings.prices, initialData, roundStep: 100 };
    const r = calcDentViaAdapter({ shape, widthMm, heightMm, conditions }, ctx);
    console.log('[pricingAdapter] Same input => single result:', r.total, '₽', r.breakdown);
    return r.total;
  };
}

watch([quickBreakdownItems, calcMode], () => {
  if (calcMode.value !== 'standard') return;
  estimateDraft.breakdown = quickBreakdownItems.value;
});

const haptic = (type) => {
  const tg = window.Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;
  if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
    if (type === 'selection') tg.HapticFeedback.selectionChanged();
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
  }
};

const showLockedStub = (message = 'Раздел в разработке 🔒') => {
  const tg = window.Telegram?.WebApp;
  if (tg?.showPopup && tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
    tg.showPopup({ title: 'В разработке', message, buttons: [{ type: 'ok' }] });
  } else {
    alert(message);
  }
  haptic('selection');
};

function showToast(text, type = 'success', duration = 1800) {
  if (toast.timeoutId) clearTimeout(toast.timeoutId);
  toast.text = text;
  toast.type = type;
  toast.actionText = null;
  toast.onAction = null;
  toast.visible = true;
  toast.timeoutId = setTimeout(() => {
    toast.visible = false;
    toast.timeoutId = null;
  }, duration);
}

function showUndoToast(text, onUndo, duration = 6000) {
  if (toast.timeoutId) clearTimeout(toast.timeoutId);
  toast.text = text;
  toast.type = 'success';
  toast.actionText = 'Отменить';
  toast.onAction = onUndo;
  toast.visible = true;
  toast.timeoutId = setTimeout(() => {
    toast.visible = false;
    toast.actionText = null;
    toast.onAction = null;
    toast.timeoutId = null;
  }, duration);
}

function getEditablePriceKeys() {
  const keys = [];
  initialData.circleSizes.forEach((s) => keys.push(s.code));
  initialData.stripSizes.forEach((s) => keys.push(s.code));
  return keys;
}

function applyPriceRegulator(type, percentDelta) {
  // +10% / −10%: добавляют/вычитают 10 п.п. от базы (100→110→120…). 0%: сброс к 100%.
  const sizes = type === 'roundOval' ? initialData.circleSizes : initialData.stripSizes;
  const snapshot = {};
  sizes.forEach((s) => {
    const v = userSettings.prices[s.code];
    if (v != null && Number.isFinite(Number(v))) snapshot[s.code] = Number(v);
  });
  if (Object.keys(snapshot).length === 0) return;

  let sumRatio = 0;
  let count = 0;
  for (const s of sizes) {
    const base = Number(s.basePrice);
    const current = Number(userSettings.prices[s.code]);
    if (base > 0 && Number.isFinite(current)) {
      sumRatio += current / base;
      count++;
    }
  }
  const currentPercent = count > 0 ? Math.round((sumRatio / count) * 100) : 100;

  const newPercent = percentDelta === 0 ? 100 : Math.max(50, Math.min(200, currentPercent + percentDelta));
  const factor = newPercent / 100;

  sizes.forEach((s) => {
    const base = Number(s.basePrice);
    if (base > 0) {
      userSettings.prices[s.code] = Math.max(0, Math.round(base * factor));
    }
  });
  saveSettings();
  haptic('success');
  const label = percentDelta > 0 ? '+10%' : (percentDelta < 0 ? '−10%' : '0%');
  const section = type === 'roundOval' ? 'Круг/Овал' : 'Полоса/Царапина';
  showUndoToast(`${section}: цены ${label}`, () => {
    sizes.forEach((s) => { if (snapshot[s.code] != null) userSettings.prices[s.code] = snapshot[s.code]; });
    saveSettings();
    haptic('success');
  });
}

function startHistoryEdit() {
  if (!selectedHistory.value) return;
  const rec = selectedHistory.value;
  const client = rec.client || {};
  historyEditDraft.clientName = client.name || '';
  historyEditDraft.clientCompany = client.company || '';
  historyEditDraft.clientPhone = client.phone || '';
  historyEditDraft.clientMood = rec.clientMood ?? null;
  historyEditDraft.carBrand = client.brand || '';
  historyEditDraft.carModel = client.model || '';
  historyEditDraft.carPlate = client.plate || '';
  historyEditDraft.inspectDate = client.date || '';
  historyEditDraft.inspectTime = client.time || '';
  historyEditDraft.comment = rec.comment || '';
  historyEditDraft.discountPercent = rec.discountPercent ?? 0;
  historyEditDraft.editManualPrice = rec.isPriceManuallyAdjusted ? (rec.manualAdjustedPrice ?? null) : null;
  historyEditDraft.attachments = (rec.attachments || []).map((a) => ({ ...a, dentIndex: a.dentIndex ?? 0 }));
  const p = rec.prepayment;
  historyEditDraft.prepayment = (p && typeof p === 'object')
    ? { amount: Number(p.amount) || 0, method: ['cash', 'transfer', 'card'].includes(p.method) ? p.method : null }
    : { amount: 0, method: null };
  isEditingHistory.value = true;
}

function cancelHistoryEdit() {
  isEditingHistory.value = false;
}

async function saveHistoryEdit() {
  if (!selectedHistory.value || isUpdatingHistory.value) return;
  isUpdatingHistory.value = true;
  try {
    const rec = selectedHistory.value;
    const manualVal = historyEditDraft.editManualPrice;
    const dmPrice = rec.dmCalculatedPrice ?? rec.total ?? 0;
    const isManual = manualVal != null && Number(manualVal) > 0 && Number(manualVal) !== Number(dmPrice);
    updateEstimate(rec.id, {
      client: {
        name: historyEditDraft.clientName,
        company: historyEditDraft.clientCompany,
        phone: historyEditDraft.clientPhone,
        brand: historyEditDraft.carBrand,
        model: historyEditDraft.carModel,
        plate: historyEditDraft.carPlate,
        date: historyEditDraft.inspectDate,
        time: historyEditDraft.inspectTime
      },
      comment: historyEditDraft.comment,
      clientMood: historyEditDraft.clientMood ?? null,
      prepayment: historyEditDraft.prepayment ?? { amount: 0, method: null },
      discountPercent: Number(historyEditDraft.discountPercent) || 0,
      attachments: historyEditDraft.attachments || [],
      dmCalculatedPrice: rec.dmCalculatedPrice ?? dmPrice,
      manualAdjustedPrice: isManual ? Number(manualVal) : null,
      isPriceManuallyAdjusted: isManual
    });
    isEditingHistory.value = false;
    showToast('История обновлена ✅', 'success', 1800);
  } catch (e) {
    showToast('Не удалось обновить историю', 'error', 2200);
  } finally {
    isUpdatingHistory.value = false;
  }
}

/** Сброс только данных клиента (имя, телефон, марка и т.д.). Вмятины и расчёт не трогаем. */
function resetClientDataOnly() {
  estimateDraft.clientName = '';
  estimateDraft.clientCompany = '';
  estimateDraft.clientPhone = '';
  estimateDraft.carBrand = '';
  estimateDraft.carModel = '';
  estimateDraft.carPlate = '';
  skipNextAutoFill.value = true;
}

/** Сброс вмятин и связанного состояния (условия, шаг). Данные клиента сохраняются. */
function resetDentsOnly() {
  form.shape = 'circle';
  form.sizeCode = null;
  form.repairCode = null;
  form.riskCode = null;
  form.materialCode = null;
  form.carClassCode = null;
  form.disassemblyCodes = ['Z0'];
  form.paintMaterialCode = null;
  form.soundInsulationCode = null;
  estimateDraft.element = null;
  estimateDraft.sizeLengthMm = null;
  estimateDraft.sizeWidthMm = null;
  estimateDraft.comment = '';
  estimateDraft.clientMood = null;
  estimateDraft.breakdown = [];
  estimateDraft.quickDents = [];
  estimateDraft.repairTimeHours = null;
  estimateDraft.discountPercent = null;
  estimateDraft.dentDiscounts = {};
  estimateDraft.attachments = [];
  estimateDraft.additionalWorks = [];
  estimateDraft.masterName = '';
  estimateDraft.prepayment = { amount: 0, method: null };
  delete estimateDraft.id;
  activeQuickDentId.value = null;
  graphicsState.dents = [];
  graphicsState.selectedClass = null;
  graphicsState.selectedPart = null;
  graphicsSelectedClassId.value = graphicsData.carClasses[0]?.id || null;
  graphicsSelectedPartId.value = graphicsPartsList.value?.[0]?.id || null;
  if (calcMode.value === 'graphics' && graphicsWizardRef.value?.resetDentsOnly) {
    graphicsWizardRef.value.resetDentsOnly();
  }
}

function resetDraftState() {
  resetClientDataOnly();
  resetDentsOnly();
}

function buildEstimatePayload(mode, lineItemsOverride) {
  const client = {
    name: estimateDraft.clientName,
    company: estimateDraft.clientCompany,
    phone: estimateDraft.clientPhone,
    brand: estimateDraft.carBrand,
    model: estimateDraft.carModel,
    plate: estimateDraft.carPlate,
    date: estimateDraft.inspectDate,
    time: estimateDraft.inspectTime
  };
  const lineItemsSnapshot = mode === 'detail' && Array.isArray(lineItemsOverride) && lineItemsOverride.length > 0
    ? lineItemsOverride
    : mode === 'quick' && quickLineItems.value?.length > 0
      ? quickLineItems.value.map((item) => {
          const clone = JSON.parse(JSON.stringify(item));
          clone.dmCalculatedLineTotal = item.appliedTotal;
          clone.appliedTotal = quickEffectiveDentLineTotal(item);
          return clone;
        })
      : null;
  const conditions = {
    repairCode: form.repairCode,
    riskCode: form.riskCode,
    materialCode: form.materialCode,
    carClassCode: form.carClassCode,
    disassemblyCodes: Array.isArray(form.disassemblyCodes) ? [...form.disassemblyCodes] : ['Z0'],
    paintMaterialCode: form.paintMaterialCode,
    soundInsulationCode: form.soundInsulationCode
  };
  const firstQuick = estimateDraft.quickDents?.[0];
  const quickElement = firstQuick?.panelElement ? `${firstQuick.panelSide || 'left'}:${firstQuick.panelElement}` : null;
  const element = quickElement || graphicsState.selectedPart?.name || null;
  const vehicleClass = graphicsState.selectedClass?.name || null;
  const discPct = clampDiscount(estimateDraft.discountPercent);
  if (mode === 'detail') {
    const normDents = graphicsDentsForPricing.value;
    const detailCondMap = estimateDraft.detailDentConditions || {};
    const dentItems = (graphicsState.dents || []).map((d, i) => {
      const norm = normDents[i];
      const bbox = d.bboxMm || {};
      const { widthMm: w, heightMm: h } = normalizeDimensions(bbox.width, bbox.height);
      const perDentCond = detailCondMap[d.id] ? { ...conditions, ...detailCondMap[d.id] } : conditions;
      return {
        id: d.id,
        type: d.type,
        bboxMm: { width: w, height: h },
        areaMm2: d.areaMm2,
        sizeCode: norm?.sizeCode ?? d.sizeCode,
        conditions: perDentCond,
        panelElement: perDentCond.panelElement ?? graphicsState.selectedPart?.name ?? null,
        photoAssetKey: d.photoAssetKey ?? null,
        discountPercent: clampDiscount(estimateDraft.dentDiscounts?.[d.id] ?? d.discountPercent ?? 0)
      };
    });
    const dentPhotoKeys = (graphicsState.dents || []).map((d) => d.photoAssetKey).filter(Boolean);
    const mainPhotoKey =
      graphicsWizardRef.value?.getPhotoAssetKey?.() ??
      graphicsWizardRef.value?.getDetailSession?.()?.photoAssetKey ??
      null;
    const photoAssets = [...new Set([...dentPhotoKeys, ...(mainPhotoKey ? [mainPhotoKey] : [])])];
    return {
      id: estimateDraft.id,
      mode: 'detail',
      client,
      vehicleClass,
      element,
      dents: { count: dentItems.length, items: dentItems },
      photoAssets,
      breakdown: estimateDraft.breakdown || [],
      lineItemsSnapshot,
      calculatedAt: new Date().toISOString(),
      total: displayTotal.value,
      rawTotal: totalPrice.value,
      dmCalculatedPrice: totalPrice.value,
      discountPercent: discPct || 0,
      comment: estimateDraft.comment || '',
      attachments: estimateDraft.attachments || [],
      clientMood: estimateDraft.clientMood ?? null,
      prepayment: estimateDraft.prepayment ?? { amount: 0, method: null }
    };
  }
  const dentItems = (estimateDraft.quickDents || []).map((d) => {
    const { widthMm: w, heightMm: h } = normalizeDimensions(d.sizeLengthMm, d.sizeWidthMm);
    const row = {
      id: d.id,
      type: d.shape,
      sizeCode: quickDentTotals.value.find((t) => t.dent.id === d.id)?.sizeCode ?? d.sizeCode,
      bboxMm: { width: w, height: h },
      panelSide: d.panelSide || 'left',
      panelElement: d.panelElement || null,
      conditions: d.conditions,
      discountPercent: clampDiscount(d.discountPercent ?? 0)
    };
    if (d.manualLineTotal != null && Number.isFinite(Number(d.manualLineTotal))) {
      row.manualLineTotal = Number(d.manualLineTotal);
    }
    if (d.manualRepairTimeHours != null && Number.isFinite(Number(d.manualRepairTimeHours))) {
      row.manualRepairTimeHours = Number(d.manualRepairTimeHours);
    }
    return row;
  });
  const additionalSumQuick = (estimateDraft.additionalWorks || []).reduce((s, w) => s + (Number(w.price) || 0), 0);
  const dmDentOnly = quickDmDentSubtotal.value;
  return {
    id: estimateDraft.id,
    mode: 'quick',
    client,
    clientMood: estimateDraft.clientMood ?? null,
    vehicleClass: null,
    element,
    dents: { count: dentItems.length, items: dentItems },
    breakdown: estimateDraft.breakdown || [],
    lineItemsSnapshot,
    calculatedAt: new Date().toISOString(),
    total: quickWorksheetGrandTotal.value,
    rawTotal: dmDentOnly + additionalSumQuick,
    dmCalculatedPrice: dmDentOnly,
    discountPercent: discPct || 0,
    comment: estimateDraft.comment || '',
    attachments: estimateDraft.attachments || [],
    prepayment: estimateDraft.prepayment ?? { amount: 0, method: null },
    additionalWorks: JSON.parse(JSON.stringify(estimateDraft.additionalWorks || [])),
    masterName: estimateDraft.masterName || '',
    recordRepairTimeHours: estimateDraft.repairTimeHours ?? null
  };
}

async function saveCurrentEstimate(modeOverride, lineItemsOverride) {
  if (isSavingHistory.value) return;
  if (!requireFeature('historyEnabled')) return;
  if (!checkHistoryLimit(historyItems.value.length)) return;
  const mode = modeOverride || (calcMode.value === 'graphics' ? 'detail' : 'quick');
  if (totalPrice.value <= 0) return;
  isSavingHistory.value = true;
  try {
    const payload = buildEstimatePayload(mode, lineItemsOverride);
    saveEstimate(payload);
    if (foundClient.value?.allRecords?.length) {
      postSaveAnalytics.value = calcPostSaveAnalytics(totalPrice.value, foundClient.value.allRecords);
    } else {
      postSaveAnalytics.value = null;
    }
    showToast('Сохранено', 'success', 1800);
    resetDraftState();
    if (calcMode.value === 'graphics') closeEditor();
    setTimeout(() => {
      selectedHistoryId.value = null;
      currentSection.value = 'history';
    }, 400);
  } catch (e) {
    showToast('Не удалось сохранить в историю', 'error', 2200);
  } finally {
    isSavingHistory.value = false;
  }
}

async function saveAndBookEstimate(modeOverride, lineItemsOverride) {
  if (isSavingHistory.value) return;
  if (!requireFeature('historyEnabled')) return;
  if (!checkHistoryLimit(historyItems.value.length)) return;
  const mode = modeOverride || (calcMode.value === 'graphics' ? 'detail' : 'quick');
  if (totalPrice.value <= 0) return;
  isSavingHistory.value = true;
  try {
    const payload = buildEstimatePayload(mode, lineItemsOverride);
    payload.status = 'scheduled';
    payload.bookingAt = new Date().toISOString();
    saveEstimate(payload);
    if (foundClient.value?.allRecords?.length) {
      postSaveAnalytics.value = calcPostSaveAnalytics(totalPrice.value, foundClient.value.allRecords);
    } else {
      postSaveAnalytics.value = null;
    }
    showToast('Записан на ремонт', 'success', 1800);
    resetDraftState();
    if (calcMode.value === 'graphics') closeEditor();
    setTimeout(() => {
      selectedHistoryId.value = null;
      currentSection.value = 'history';
    }, 400);
  } catch (e) {
    showToast('Не удалось сохранить', 'error', 2200);
  } finally {
    isSavingHistory.value = false;
  }
}

function clearHistoryConfirm() {
  if (historyItems.value.length === 0) return;
  if (confirm('Очистить всю историю?')) clearHistory();
}

function generateQaHistoryRecords() {
  if (!import.meta.env?.DEV) return;
  const statuses = ['estimate', 'estimate', 'scheduled', 'done'];
  const names = ['Иван', '', 'Мария Петрова', 'Алексей', 'ООО Рога'];
  const phones = ['+79001234567', '', '89001234568', '+7 900 111 22 33'];
  const cars = [{ b: 'Toyota', m: 'Camry' }, { b: '', m: '' }, { b: 'BMW', m: 'X5' }];
  const now = Date.now();
  const day = 86400000;
  for (let i = 0; i < 20; i++) {
    const d = new Date(now - i * day * (i % 4 === 0 ? 0 : i % 4 === 1 ? 1 : i % 4 === 2 ? 7 : 40));
    const draft = {
      client: {
        name: names[i % names.length],
        phone: phones[i % phones.length],
        brand: cars[i % 3].b,
        model: cars[i % 3].m
      },
      dents: { count: i % 2 + 1, items: [{ panelElement: 'Капот', sizeCode: 'S2' }] },
      total: 5000 + i * 500,
      rawTotal: 5000 + i * 500,
      createdAt: d.toISOString(),
      status: statuses[i % 4],
      element: 'Капот',
      comment: i % 3 === 0 ? 'Тест' : ''
    };
    saveEstimate(draft);
  }
  loadHistory(true);
}

function deleteHistoryConfirm(id) {
  if (!id) return;
  if (confirm('Удалить оценку из истории?')) {
    deleteEstimate(id);
    if (selectedHistoryId.value === id) selectedHistoryId.value = null;
  }
}

function handleHistoryStatusUpdate({ id, status, bookingAt }) {
  if (!id) return;
  updateEstimate(id, { status, bookingAt: bookingAt || null });
}

const historyDetailStatuses = [
  { key: 'estimate', label: 'Без записи', activeClass: 'border-gray-500 bg-gray-800/50 text-gray-300' },
  { key: 'scheduled', label: 'Записан', activeClass: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  { key: 'done', label: 'Выполнено', activeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-400' }
];

function changeDetailStatus(status) {
  if (!selectedHistory.value) return;
  const bookingAt = status === 'scheduled' ? new Date().toISOString() : null;
  updateEstimate(selectedHistory.value.id, { status, bookingAt });
}

function onHistoryMoodChange(mood) {
  historyEditDraft.clientMood = mood;
  if (selectedHistory.value?.id) {
    updateEstimate(selectedHistory.value.id, { clientMood: mood });
    showToast('Сохранено', 'success', 1200);
  }
}

const setMode = (mode) => {
  if (mode === 'time') {
    showLockedStub('Раздел в разработке 🔒');
    return;
  }
  calcMode.value = mode;
  if (mode === 'standard') quickStep.value = userSettings.showClientQuick ? 1 : 2;
  nextTick(() => scrollMetricToTop());
  haptic('selection');
  if (mode === 'graphics') {
    if (window.Telegram?.WebApp?.expand) window.Telegram.WebApp.expand();
    ensureGraphicsSelection();
  }
};

const openMetricMenu = () => {
  if (calcMode.value === 'graphics') closeEditor();
  currentSection.value = 'metric';
  calcMode.value = '';
  ensureInspectDateTime();
  haptic('selection');
};

const selectMetricMode = (mode) => {
  if (mode === 'time') {
    showLockedStub('Раздел в разработке 🔒');
    return;
  }
  if (currentSection.value !== 'metric') {
    currentSection.value = 'metric';
    ensureInspectDateTime();
  }
  if (calcMode.value === 'graphics' && mode !== 'graphics') {
    closeEditor();
  }
  setMode(mode);
};

const goToHistory = () => {
  if (requireFeature('historyEnabled')) {
    historyClientPhoneFilter.value = '';
    switchSection('history');
  }
};

const onProfileClick = async () => {
  await account.initialize();
  if (!account.isAuthenticated.value || !account.isProfileComplete.value) {
    switchSection('onboarding');
  } else {
    switchSection('account');
  }
};

const switchSection = (section) => {
  if (section === 'analytics' || section === 'journal') {
    currentSection.value = section;
    showLockedStub('Раздел в разработке 🔒');
    return;
  }
  if (section !== 'metric' && calcMode.value === 'graphics') closeEditor();
  currentSection.value = section;
  if (section === 'history') {
    selectedHistoryId.value = null;
    isEditingHistory.value = false;
    loadHistory(true);
  } else {
    postSaveAnalytics.value = null;
  }
  haptic('selection');
  nextTick(() => {
    const container = section === 'metric' ? metricScrollRef.value : section === 'settings' ? settingsScrollRef.value : section === 'info' ? infoScrollRef.value : null;
    if (container?.scrollTo) container.scrollTo({ top: 0, behavior: 'auto' });
  });
  if (section === 'metric') {
    ensureInspectDateTime();
  }
};

const goQuickBack = () => {
  if (quickStep.value <= 1) {
    calcMode.value = '';
    return;
  }
  if (quickStep.value === 2 && !userSettings.showClientQuick) {
    calcMode.value = '';
    return;
  }
  quickStep.value -= 1;
  nextTick(() => scrollMetricToTop());
};

const goQuickNext = () => {
  if (quickStep.value === 1 && userSettings.showClientQuick && !clientDataValid.value) return;
  if ((quickStep.value === 2 || (quickStep.value === 1 && !userSettings.showClientQuick)) && !quickStep2Valid.value) return;
  if (quickStep.value < 3) quickStep.value += 1;
  nextTick(() => scrollMetricToTop());
};

const goHome = () => {
  if (calcMode.value === 'graphics') closeEditor();
  historyClientPhoneFilter.value = '';
  currentSection.value = 'home';
  haptic('selection');
};

const addMaster = () => userSettings.masters.push({ name: '', rate: 0 });
const removeMaster = (i) => userSettings.masters.splice(i, 1);

const systemArmatureWorks = getAllSystemArmatureWorks();
const newArmatureWorkName = ref('');
const newArmatureWorkPrice = ref(0);
function effectiveArmaturePrice(code) {
  const overrides = userSettings.armaturePriceOverrides || {};
  if (overrides[code] != null) return overrides[code];
  const w = systemArmatureWorks.find((x) => x.code === code);
  return w?.price ?? 0;
}
function setArmaturePriceOverride(code, val) {
  const num = Number(val);
  const cur = userSettings.armaturePriceOverrides || {};
  if (Number.isNaN(num) || num < 0) {
    const next = { ...cur }; delete next[code]; userSettings.armaturePriceOverrides = next;
  } else {
    userSettings.armaturePriceOverrides = { ...cur, [code]: num };
  }
}
function addCustomArmatureWork() {
  const name = String(newArmatureWorkName.value || '').trim();
  if (!name) return;
  const price = Number(newArmatureWorkPrice.value) || 0;
  if (!userSettings.customArmatureWorks) userSettings.customArmatureWorks = [];
  userSettings.customArmatureWorks.push({ id: `custom_${Date.now()}`, name, price });
  newArmatureWorkName.value = '';
  newArmatureWorkPrice.value = 0;
}
function removeCustomArmatureWork(idx) {
  userSettings.customArmatureWorks?.splice(idx, 1);
}

const saveSettings = () => {
  const validated = validateSettings({ ...userSettings });
  const dataToSave = {
    prices: userSettings.prices,
    masters: userSettings.masters,
    clientRequired: userSettings.clientRequired,
    showClientQuick: userSettings.showClientQuick,
    showClientDetail: userSettings.showClientDetail,
    requirePhone: userSettings.requirePhone,
    requireName: userSettings.requireName,
    requireCarBrandModel: userSettings.requireCarBrandModel,
    autoSaveHistory: userSettings.autoSaveHistory,
    showInfoTooltips: userSettings.showInfoTooltips,
    priceRoundStep: userSettings.priceRoundStep,
    sizeUnit: userSettings.sizeUnit,
    showRepairTime: userSettings.showRepairTime,
    showPaintMaterial: userSettings.showPaintMaterial,
    showSoundInsulation: userSettings.showSoundInsulation,
    enableSecondDentDiscount: userSettings.enableSecondDentDiscount,
    secondDentDiscountPercent: userSettings.secondDentDiscountPercent,
    discountSamePartEnabled: userSettings.discountSamePartEnabled,
    discountSamePartValue: validated.discountSamePartValue,
    discountDiffPartEnabled: userSettings.discountDiffPartEnabled,
    discountDiffPartValue: validated.discountDiffPartValue,
    priceAdjustmentRoundOval: validated.priceAdjustmentRoundOval,
    priceAdjustmentStripe: validated.priceAdjustmentStripe,
    useQuickUiInDetail: userSettings.useQuickUiInDetail,
    customArmatureWorks: userSettings.customArmatureWorks || [],
    armaturePriceOverrides: userSettings.armaturePriceOverrides || {}
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(dataToSave));
  const tg = window.Telegram?.WebApp;
  if (tg?.showPopup && tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
    tg.showPopup({ title: 'Готово', message: 'Настройки сохранены', buttons: [{ type: 'ok' }] });
  } else {
    alert('Настройки сохранены');
  }
  haptic('success');
};

const resetDefaults = () => {
  if (confirm('Сбросить цены к стандартным?')) {
    Object.assign(userSettings.prices, buildDefaultPrices());
    userSettings.clientRequired = false;
    userSettings.showClientQuick = true;
    userSettings.showClientDetail = true;
    userSettings.requirePhone = true;
    userSettings.requireName = true;
    userSettings.requireCarBrandModel = false;
    userSettings.autoSaveHistory = false;
    userSettings.showInfoTooltips = true;
    userSettings.priceRoundStep = 0;
    userSettings.sizeUnit = 'mm';
    userSettings.priceAdjustmentRoundOval = 1.0;
    userSettings.priceAdjustmentStripe = 1.0;
    userSettings.discountSamePartEnabled = false;
    userSettings.discountSamePartValue = 50;
    userSettings.discountDiffPartEnabled = false;
    userSettings.discountDiffPartValue = 0;
    saveSettings();
  }
};

async function openClientField(field, label, inputType, placeholder) {
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: estimateDraft[field] ?? '',
    inputType,
    placeholder,
    mask
  });
  if (value !== undefined && value !== null) {
    estimateDraft[field] = typeof value === 'string' ? value : String(value);
  }
}

/** Редактирование клиента на экране итогового расчёта (step 3): переход на шаг 1 или открытие первого поля */
function onQuickStep3EditClient() {
  if (userSettings.showClientQuick) {
    quickStep.value = 1;
    nextTick(() => scrollMetricToTop());
  } else {
    openClientField('clientName', 'Имя клиента', 'text', 'Имя клиента');
  }
}

const QUICK_CLIENT_FIELD_MAP = {
  name: ['clientName', 'Имя клиента', 'text', 'Имя клиента'],
  phone: ['clientPhone', 'Телефон', 'tel', 'Телефон'],
  car: ['carBrand', 'Марка автомобиля', 'text', 'Марка'],
  company: ['clientCompany', 'Компания (необязательно)', 'text', 'Компания']
};

function onQuickStep3EditClientField(key) {
  const [field, label, inputType, placeholder] = QUICK_CLIENT_FIELD_MAP[key] || [];
  if (field) openClientField(field, label, inputType, placeholder);
}

async function openRepairHoursModal() {
  const value = await openInputModal({
    title: 'Часы работы',
    label: 'Время ремонта (ч)',
    value: estimateDraft.repairTimeHours != null && estimateDraft.repairTimeHours !== '' ? estimateDraft.repairTimeHours : '',
    inputType: 'number',
    placeholder: 'ч',
    min: 0,
    step: 0.5
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) estimateDraft.repairTimeHours = Number(value);
  else if (value === '' || value === null) estimateDraft.repairTimeHours = null;
}

async function openCommentModal() {
  const value = await openInputModal({
    title: 'Комментарий',
    label: 'Комментарий к оценке (необязательно)',
    value: estimateDraft.comment ?? '',
    multiline: true,
    placeholder: 'Введите комментарий...'
  });
  if (value !== undefined) estimateDraft.comment = value ?? '';
}

async function openQuickDentSizeModal(dent, field, label) {
  const value = await openInputModal({
    title: 'Произвольный размер',
    label,
    value: dent[field] != null && dent[field] > 0 ? dent[field] : '',
    inputType: 'number',
    placeholder: 'мм',
    min: 0.1,
    step: 0.5
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    dent[field] = Number(value);
    syncQuickDentSizeFromMm(dent);
    return dent[field];
  }
  return undefined;
}

async function openHistoryEditField(field, label, inputType) {
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const value = await openInputModal({
    title: 'Редактирование',
    label,
    value: historyEditDraft[field] ?? '',
    inputType,
    placeholder: label,
    mask
  });
  if (value !== undefined && value !== null) {
    historyEditDraft[field] = typeof value === 'string' ? value : String(value);
  }
}

async function openHistoryCommentModal() {
  const value = await openInputModal({
    title: 'Комментарий',
    label: 'Комментарий (необязательно)',
    value: historyEditDraft.comment ?? '',
    multiline: true,
    placeholder: 'Введите комментарий...'
  });
  if (value !== undefined) historyEditDraft.comment = value ?? '';
}

function scrollFieldIntoView(e) {
  const el = e?.target || e;
  if (!el?.scrollIntoView) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  });
}

function getSizeCodeFromMm(shape, lengthMm, widthMm) {
  const l = Number(lengthMm);
  const w = Number(widthMm);
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return null;
  const sizes = shape === 'circle' ? circleSizesMm : stripSizesMm;
  const area = shape === 'circle'
    ? Math.PI * (l / 2) * (w / 2)
    : l * w;
  let closest = sizes[0];
  let minDist = Math.abs((closest?.mm?.w || 0) * (closest?.mm?.h || 0) - area);
  sizes.forEach((s) => {
    const sArea = (s.mm?.w || 0) * (s.mm?.h || 0);
    const dist = Math.abs(sArea - area);
    if (dist < minDist) {
      minDist = dist;
      closest = s;
    }
  });
  return closest?.code || null;
}


// Graphics
const closeEditor = () => {
  calcMode.value = '';
  currentSection.value = 'home';
  graphicsState.dents = [];
  haptic('selection');
};

// Telegram Main Button — globally disabled; app uses its own CTA buttons.

watch(selectedHistoryId, () => {
  isEditingHistory.value = false;
});

watch(selectedHistory, (rec) => {
  if (!rec) return;
  const client = rec.client || {};
  historyEditDraft.clientName = client.name || '';
  historyEditDraft.clientCompany = client.company || '';
  historyEditDraft.clientPhone = client.phone || '';
  historyEditDraft.carBrand = client.brand || '';
  historyEditDraft.carModel = client.model || '';
  historyEditDraft.carPlate = client.plate || '';
  historyEditDraft.inspectDate = client.date || '';
  historyEditDraft.inspectTime = client.time || '';
  historyEditDraft.comment = rec.comment || '';
  historyEditDraft.clientMood = rec.clientMood ?? null;
  const p = rec.prepayment;
  historyEditDraft.prepayment = (p && typeof p === 'object')
    ? { amount: Number(p.amount) || 0, method: ['cash', 'transfer', 'card'].includes(p.method) ? p.method : null }
    : { amount: 0, method: null };
}, { immediate: true });

watch(
  () => ({
    showClientQuick: userSettings.showClientQuick,
    showClientDetail: userSettings.showClientDetail,
    clientRequired: userSettings.clientRequired,
    requirePhone: userSettings.requirePhone,
    requireName: userSettings.requireName,
    requireCarBrandModel: userSettings.requireCarBrandModel,
    autoSaveHistory: userSettings.autoSaveHistory,
    showInfoTooltips: userSettings.showInfoTooltips,
    priceRoundStep: userSettings.priceRoundStep,
    sizeUnit: userSettings.sizeUnit,
    showRepairTime: userSettings.showRepairTime,
    showPaintMaterial: userSettings.showPaintMaterial,
    showSoundInsulation: userSettings.showSoundInsulation,
    enableSecondDentDiscount: userSettings.enableSecondDentDiscount,
    secondDentDiscountPercent: userSettings.secondDentDiscountPercent
  }),
  (val) => {
    const data = {
      prices: userSettings.prices,
      masters: userSettings.masters,
      ...val
    };
    localStorage.setItem('dentRepairSettings_v6', JSON.stringify(data));
  },
  { deep: true }
);

watch(
  () => userSettings.showClientQuick,
  (show) => {
    if (calcMode.value !== 'standard') return;
    // If client step is disabled while currently on it, skip forward to dents.
    // When enabling again, keep current step (no surprise jump backwards).
    if (!show && quickStep.value === 1) quickStep.value = 2;
    nextTick(() => scrollMetricToTop());
  }
);

watch(quickStep, (step) => {
  if (step === 3 && !estimateDraft.id) {
    estimateDraft.id = generateRecordId();
  }
  const onDentsStep = step === 2 || (step === 1 && !userSettings.showClientQuick);
  if (onDentsStep && estimateDraft.quickDents.length === 0) {
    addQuickDent();
  }
  if (onDentsStep && estimateDraft.quickDents.length > 0) {
    estimateDraft.quickDents.forEach((dent) => normalizeQuickDentPanel(dent));
    if (!activeQuickDentId.value) activeQuickDentId.value = estimateDraft.quickDents[0]?.id || null;
  }
});

watch(quickStep, (step, prev) => {
  if (userSettings.autoSaveHistory && calcMode.value === 'standard' && step === 3 && prev === 2 && quickTotal.value > 0 && !isSavingHistory.value) {
    nextTick(() => saveCurrentEstimate('quick'));
  }
});

const handleKeyDown = (e) => {
  if (calcMode.value !== 'graphics') return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const active = document.activeElement;
    const isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (typeof active.isContentEditable === 'boolean' && active.isContentEditable));
    if (isEditable) return;
    e.preventDefault();
    deleteSelected();
  }
};

onMounted(async () => {
  expandTelegramWebApp();
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
  }
  hideTelegramButtons();
  await account.initialize();
  window.addEventListener('keydown', handleKeyDown);
  updateFooterHeight();
  footerResizeObserver = new ResizeObserver(() => updateFooterHeight());
  if (bottomNavRef.value) footerResizeObserver.observe(bottomNavRef.value);
  window.addEventListener('resize', updateFooterHeight);
  ensureInspectDateTime();
  loadHistory();
});

watch(
  () => calcMode.value === 'graphics',
  (isGraphics) => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('graphics-fullscreen-active', isGraphics);
    if (isGraphics && window.Telegram?.WebApp?.expand) window.Telegram.WebApp.expand();
  },
  { immediate: true }
);

watch(
  () => [currentSection.value, calcMode.value],
  () => {
    if (currentSection.value !== 'metric') return;
    if (calcMode.value === 'graphics') return;
    nextTick(() => scrollMetricToTop());
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', updateFooterHeight);
  if (footerResizeObserver && bottomNavRef.value) footerResizeObserver.unobserve(bottomNavRef.value);
  if (footerResizeObserver) footerResizeObserver.disconnect();
});
</script>

<style scoped>
.text-metric-green { color: #88e523; }
.text-metric-silver { color: #a0aec0; }
.bg-metric-green { background-color: #88e523; }
.border-metric-green { border-color: #88e523; }

/* Страница клиента: эталон токенов (qc-preset-chip — второстепенная кнопка; СБРОС — ghost, серый) */
.client-reset-btn {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: 6px;
  color: #888;
  background: transparent;
  border: 1px solid #444;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.client-reset-btn:hover {
  color: #aaa;
  border-color: #555;
}

.post-save-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: #9e9e9e;
}
.post-save-hint__icon {
  font-size: 14px;
  opacity: 0.8;
}

.qc-reset-btn {
  background: rgba(0, 0, 0, 0.35);
  color: #777;
  border-color: #3a3a3a;
}
.qc-reset-btn:hover {
  background: rgba(0, 0, 0, 0.45);
  color: #999;
  border-color: #4a4a4a;
}
.client-input-row {
  min-height: 36px;
}

/* ═══ Settings module — History/Profile quality patterns ═══ */
.settings-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.settings-screen__content {
  flex: 1 1 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: 8px;
}
.settings-screen__title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.settings-section-card {
  background: linear-gradient(180deg, #1e1e1e 0%, #121212 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
.dm-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  min-height: 52px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.dm-section-header:hover { background: rgba(255, 255, 255, 0.03); }
.dm-section-header__left { display: flex; align-items: center; gap: 10px; }
.dm-section-header__icon { font-size: 18px; opacity: 0.9; }
.dm-section-header__title { font-size: 14px; font-weight: 700; color: #fff; }
.dm-section-header__chevron {
  font-size: 18px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}
.dm-section-header__chevron.open { transform: rotate(90deg); }
.settings-section-content {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
/* Subsection labels (standalone, between rows) */
.dm-settings-subsection-label,
.settings-subsection-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #888;
  margin-top: 16px;
  margin-bottom: 4px;
  padding: 0;
}
.dm-settings-subsection-label:first-child,
.settings-subsection-label:first-child { margin-top: 0; }
.dm-settings-multiplier-value {
  font-size: 11px;
  color: #888;
  margin-top: -6px;
  margin-bottom: 8px;
  padding: 0;
}
.settings-helper-text {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
  line-height: 1.4;
}

.dm-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  min-height: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 12px;
}
.dm-settings-row:last-child { border-bottom: none; }
/* Stacked variant: label+helper on top, control full-width below (for wide button groups) */
.dm-settings-row--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 14px 0;
}
.dm-settings-row__control--full {
  width: 100%;
}
/* Left text block: label on top, helper below — flex column stacks them */
.dm-settings-row__label-area {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1 1 0;
  min-width: 0;
}
.dm-settings-row__label {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}
.dm-settings-row__description {
  font-size: 11px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.4;
}
.dm-settings-row__control { flex-shrink: 0; }
.dm-segment-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.dm-segment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s;
}
.dm-segment-btn:hover { border-color: rgba(255, 255, 255, 0.2); color: #e5e7eb; }
.dm-segment-btn.active {
  background: #88e523;
  border-color: #88e523;
  color: #000;
  font-weight: 600;
}
label.dm-segment-btn { margin: 0; }
.dm-segment-btn--add {
  background: rgba(136, 229, 35, 0.15);
  border-color: rgba(136, 229, 35, 0.4);
  color: #88e523;
}
.dm-segment-btn--add:hover { background: rgba(136, 229, 35, 0.25); }
.dm-settings-row__toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.dm-toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}
.dm-toggle-track--on { background: #88e523; }
.dm-toggle-thumb {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}
/* Toggle thumb uses Tailwind peer-checked:translate-x-5 */
.dm-number-input {
  width: 80px;
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #151515;
  color: #fff;
  font-size: 15px;
  text-align: center;
  padding: 0 8px;
}
.dm-number-input--wide { width: 7rem; min-width: 7rem; text-align: right; }
.dm-number-input--action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-width: 100px;
}
.dm-number-input__edit { color: #6b7280; font-size: 12px; }
.dm-text-input {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #151515;
  color: #fff;
  font-size: 14px;
}
.dm-settings-row__remove {
  padding: 8px;
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 8px;
  cursor: pointer;
}
.dm-settings-row--custom,
.dm-settings-row--add { flex-wrap: wrap; }
.dm-settings-row--header { border-bottom: none; padding-bottom: 8px; }

.settings-screen__footer {
  flex-shrink: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--dm-surface, #161616);
  border-top: 1px solid var(--dm-border, rgba(255, 255, 255, 0.1));
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dm-btn {
  min-height: 50px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dm-btn--primary {
  background: #88e523;
  color: #000;
  box-shadow: 0 0 15px rgba(136, 229, 35, 0.4);
}
.dm-btn--primary:active { opacity: 0.9; }
.dm-btn--secondary {
  background: transparent;
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.dm-btn--secondary:hover { color: #fff; }
.dm-btn--full { width: 100%; }

.app-root {
  --app-footer-height: calc(64px + env(safe-area-inset-bottom, 0px));
  --content-padding-bottom: calc(var(--app-footer-height) + 1rem);
  min-height: 100dvh;
  height: 100dvh;
}
@media (max-height: 500px) {
  .app-root { min-height: 100vh; height: 100vh; }
}
.content-padding-bottom {
  padding-bottom: var(--content-padding-bottom);
}

/* History detail: sticky action bar above tab bar */
.app-root {
  --history-detail-actions-h: 80px;
}
.history-detail-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--app-footer-height);
  z-index: 40;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
  background: #000;
}
.history-detail-actions__inner {
  width: 100%;
}
.history-detail-wrapper .history-detail-content {
  padding-bottom: calc(var(--content-padding-bottom) + var(--history-detail-actions-h));
}
.app-root--gradient {
  background: #000000;
}
.app-root--solid {
  background: #000000;
}

.wow-screen-content {
  width: 100%;
  max-width: var(--content-max-w);
  margin-left: auto;
  margin-right: auto;
  padding: 0;
  box-sizing: border-box;
}

/* Unified tile grid: same on Home and Mode Selection — uses layout tokens */
.wow-tile-grid,
.wow-screen-shell__tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: var(--tiles-gap);
  width: 100%;
  max-width: var(--content-max-w);
  margin-left: auto;
  margin-right: auto;
  padding: 0;
  box-sizing: border-box;
}

.wow-tile {
  border-radius: var(--tile-radius);
  padding: var(--wow-tile-padding, 1.25rem);
  min-height: var(--tile-h);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.wow-tile-empty {
  min-width: 0;
  min-height: 0;
  background: transparent;
  border: none;
  pointer-events: none;
}

/* Wow tiles: premium depth, neon border + glow on active; mobile pressed = scale 0.98 */
.home-btn-primary {
  --wow-tile-inner: var(--wow-tile-inner-highlight, rgba(255, 255, 255, 0.08));
  background: linear-gradient(180deg, rgba(48, 48, 48, 0.97) 0%, rgba(26, 26, 26, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 var(--wow-tile-inner),
    var(--wow-tile-shadow-depth, 0 6px 20px rgba(0, 0, 0, 0.5)),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  border: 1px solid var(--wow-tile-border-active, rgba(136, 229, 35, 0.45));
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.home-btn-primary:hover {
  border-color: rgba(136, 229, 35, 0.55);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.5),
    var(--wow-tile-glow-active, 0 0 24px rgba(136, 229, 35, 0.35)),
    0 0 0 1px rgba(136, 229, 35, 0.45);
}
.home-btn-primary:active {
  transform: scale(0.98);
  box-shadow:
    inset 0 1px 0 var(--wow-tile-inner),
    0 4px 16px rgba(0, 0, 0, 0.5),
    0 0 28px rgba(136, 229, 35, 0.4),
    0 0 0 1px rgba(136, 229, 35, 0.5);
}
.home-btn-primary,
.home-btn-disabled {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
@media (prefers-reduced-motion: reduce) {
  .home-btn-primary:active { transform: none; }
}
.home-btn-disabled {
  background: linear-gradient(180deg, rgba(28, 28, 28, 0.92) 0%, rgba(18, 18, 18, 0.96) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 3px 10px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: none;
}

/* Shared menu card style: main screen + metric mode picker (dark charcoal, rounded, square) — single source of truth */
.menu-card-btn {
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  background-color: #2C2C2C;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.menu-card-btn--active {
  border: 2px solid #88e523;
  box-shadow: 0 0 18px rgba(136, 229, 35, 0.3), 0 0 32px rgba(136, 229, 35, 0.1);
}
.menu-card-btn--active:hover,
.menu-card-btn--active:focus {
  border-color: #88e523;
  box-shadow: 0 0 22px rgba(136, 229, 35, 0.4), 0 0 40px rgba(136, 229, 35, 0.15);
}
.menu-card-btn--inactive {
  border: 1px solid rgba(60, 60, 60, 0.9);
}
.menu-card-btn--inactive:hover,
.menu-card-btn--inactive:focus {
  border-color: rgba(255, 255, 255, 0.12);
}
@media (prefers-reduced-motion: reduce) {
  .menu-card-btn--active:hover,
  .menu-card-btn--active:focus {
    box-shadow: 0 0 18px rgba(136, 229, 35, 0.3), 0 0 32px rgba(136, 229, 35, 0.1);
  }
}
.menu-card-btn:focus-visible {
  outline: 2px solid rgba(136, 229, 35, 0.6);
  outline-offset: 2px;
}
.menu-card-btn-icon--active { color: #88e523; }
.menu-card-btn-icon--inactive { color: rgba(255, 255, 255, 0.55); }
.menu-card-btn--active .menu-card-btn-label,
.menu-card-btn--active .menu-card-btn-sublabel { color: #88e523; }
.menu-card-btn--inactive .menu-card-btn-label,
.menu-card-btn--inactive .menu-card-btn-sublabel { color: rgba(255, 255, 255, 0.7); }
.menu-card-btn-sublabel .menu-card-lock { color: #C9A227; }
.menu-card-btn-label { line-height: 1.2; }
.menu-card-btn-sublabel { line-height: 1.25; }

.home-btn-disabled {
  opacity: 0.7;
  filter: saturate(0.5);
  pointer-events: none;
}
.home-btn-disabled:hover { opacity: 0.7; filter: saturate(0.5); }

@media (min-width: 480px) {
  .wow-tile-grid,
  .wow-screen-shell__tiles { max-width: var(--content-max-w); gap: var(--tiles-gap); }
  .wow-screen-content { max-width: var(--content-max-w); }
}
@media (min-width: 768px) {
  .wow-tile-grid,
  .wow-screen-shell__tiles { max-width: var(--content-max-w); }
  .wow-screen-content { max-width: var(--content-max-w); }
}

/* Quick Calculation: Back/Next bar — прижат к меню, без просветов */
.quick-nav-bar {
  margin-bottom: 0;
  box-shadow: 0 2px 0 0 #080808; /* перекрывает субпиксельный зазор с bottom-nav */
}
.quick-nav-buttons {
  gap: 0;
  min-width: 0;
}
.quick-nav-btn-back {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 0.75rem;
  border-bottom-left-radius: 0.75rem;
}
.quick-nav-btn-next {
  border-left-width: 1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}
@media (min-width: 641px) {
  .quick-nav-buttons {
    gap: 0.5rem;
  }
  .quick-nav-btn-back {
    border-right-width: 1px;
    border-top-right-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
  }
  .quick-nav-btn-next {
    border-left-width: 1px;
    border-top-left-radius: 0.75rem;
    border-bottom-left-radius: 0.75rem;
  }
}

/* ── Compact Quick-Calc Step 2 overrides (fit on 375×667) ── */
.qc-compact {
  --qc-section-gap: 6px;
  --qc-card-px: 10px;
  --qc-card-py: 8px;
  --qc-row-min-h: 36px;
  --qc-seg-min-h: 36px;
  --qc-label-fs: 9px;
  --qc-value-fs: 12px;
  --qc-title-fs: 9px;
}
.qc-compact .segmented-wrap {
  padding: 2px;
  gap: 2px;
}
.qc-compact .segmented-btn {
  min-height: var(--qc-seg-min-h);
  padding: 6px 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.qc-compact .qc-select-row {
  min-height: var(--qc-row-min-h);
  padding: 6px 10px;
  border-radius: 0.625rem;
}
.qc-compact .qc-select-row .qc-sr-label {
  font-size: var(--qc-label-fs);
  margin-bottom: 0;
}
.qc-compact .qc-select-row .qc-sr-value {
  font-size: var(--qc-value-fs);
}
.qc-compact .qc-section-title {
  font-size: var(--qc-title-fs);
}
.qc-compact .qc-geo-btn {
  min-height: 42px;
  padding: 6px 10px;
  border-radius: 0.625rem;
}
.qc-compact .qc-geo-btn .qc-geo-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}
.qc-compact .qc-geo-btn .qc-geo-value {
  font-size: 13px;
  font-weight: 600;
  margin-top: 1px;
}
.qc-compact .qc-info-rows {
  font-size: 11px;
  line-height: 1.35;
  color: #6b7280;
  margin-top: 4px;
}
.qc-compact .qc-info-rows span {
  color: #88e523;
}
.qc-compact .qc-price-block {
  text-align: center;
  padding: 6px 0 2px;
}
.qc-compact .qc-price-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}
.qc-compact .qc-price-value {
  font-size: 28px;
  font-weight: 800;
  color: #88e523;
  line-height: 1.15;
}
.qc-compact .qc-cta {
  min-height: 42px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 0.75rem;
  color: #000;
  background: #88e523;
  box-shadow: 0 0 15px rgba(136,229,35,0.35);
}
.qc-compact .qc-cta:active { opacity: 0.9; }
.qc-compact .qc-cta:disabled { opacity: 0.45; cursor: not-allowed; }
.qc-compact .qc-preset-chip {
  font-size: 10px;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(136,229,35,0.25);
  color: #88e523;
  background: rgba(136,229,35,0.08);
  cursor: pointer;
}

/* A) Тёмный фон редактора: перебить любые bg-white/konva-bg (Konva bgRect — страховка в konvaEditor.js) */
/* Матрица без отступов: padding 0, margin 0, width/height 100% */
.canvas-editor-wrap,
#canvas-wrapper,
#konva-container {
  background-color: #0b0f14 !important;
  background-image: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
}
.canvas-editor-wrap.konva-bg { background-image: none !important; }

/* Fullscreen: контейнер графики занимает весь экран (fixed), 100dvh, без прокрутки body */
/* Safe area только на header и controls, НЕ на matrixArea */
.graphics-fullscreen-wrapper {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  padding: 0 0 var(--app-footer-height) 0;
  margin: 0;
  border-radius: 0;
  background: #000;
}

.graphics-header {
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

.graphics-stage-area {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  padding: 0;
  margin: 0;
  border: none;
}

.graphics-controls-area {
  flex-shrink: 0;
  max-height: 45vh;
  overflow-y: auto;
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Body без прокрутки при активной графике */
body.graphics-fullscreen-active {
  overflow: hidden;
  height: 100dvh;
  min-height: 100dvh;
  min-height: 100vh;
}

/* Fullscreen pseudo (кнопка «полноэкранный») */
.graphics-fullscreen-wrapper.graphics-fullscreen-pseudo {
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

/* Bottom nav: ref look — dark bar, subtle separators, active green; tokenized height */
.bottom-nav {
  background: linear-gradient(180deg, #0c0c0c 0%, #080808 100%);
  min-height: var(--bottom-nav-h);
}
.bottom-nav-btn {
  position: relative;
}
.bottom-nav-btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
}
.bottom-nav-btn--active {
  color: #88e523;
  background: rgba(136, 229, 35, 0.08);
  box-shadow: 0 0 10px rgba(136, 229, 35, 0.15);
}
.bottom-nav-btn--idle {
  color: #6b7280;
}
.bottom-nav-btn--idle:hover {
  color: #9ca3af;
}
.bottom-nav-btn:focus-visible {
  outline: 2px solid rgba(136, 229, 35, 0.5);
  outline-offset: 2px;
}
</style>

<!-- build test -->
