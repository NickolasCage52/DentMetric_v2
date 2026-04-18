<template>
  <div ref="appRootRef" class="app-root max-w-md mx-auto relative min-h-[100dvh] h-screen flex flex-col text-white overflow-x-hidden pb-[env(safe-area-inset-bottom)]" :class="{ 'app-root--gradient': currentSection === 'home', 'app-root--solid': currentSection !== 'home' }">
    <div v-if="!isOnlineState" class="offline-banner" role="status">
      Офлайн — данные сохраняются локально
    </div>
    <div v-if="pwaNeedRefresh" class="sw-update-toast">
      <span>Доступно обновление</span>
      <button type="button" class="sw-update-toast__btn" @click="pwaReload">Обновить</button>
    </div>
    <ProfileView
      v-if="currentSection === 'profile'"
      @back="closeProfileScreen"
      @navigate="handleSettingsNavigate"
    />
    <SyncSettingsView
      v-else-if="currentSection === 'sync-settings'"
      @back="closeSyncSettings"
    />
    <SettingsHubView
      v-else-if="currentSection === 'settings-hub'"
      @back="closeSettingsHub"
      @navigate="handleSettingsNavigate"
    />
    <SettingsPlaceholder
      v-else-if="currentSection === 'hub-placeholder'"
      :title="hubPlaceholderTitle"
      :message="hubPlaceholderMessage"
      @back="closeHubPlaceholder"
    />
    <EmployeesListView
      v-else-if="currentSection === 'employees'"
      @back="closeEmployeesList"
      @navigate="handleSettingsNavigate"
      @open-employee="openEmployeeCard"
      @create-employee="openEmployeeCreate"
    />
    <EmployeeCardView
      v-else-if="currentSection === 'employee-card' || currentSection === 'employee-create'"
      :employee-id="currentSection === 'employee-create' ? undefined : employeeViewId"
      @back="closeEmployeeCard"
      @saved="onEmployeeSaved"
    />
    <JournalView
      v-else-if="currentSection === 'journal'"
      @back="closeJournal"
      @open-booking="openJournalBooking"
      @create-booking="openJournalCreate"
    />
    <BookingDetailView
      v-else-if="currentSection === 'booking-detail' && journalBookingId"
      :booking-id="journalBookingId"
      @back="onBookingDetailBack"
      @open-estimate="openEstimateFromJournal"
      @open-order-document="handleOpenOrderDocument"
    />
    <CreateBookingView
      v-else-if="currentSection === 'booking-create' && journalCreateParams"
      :date="journalCreateParams.date"
      :start-time="journalCreateParams.time"
      :master-id="journalCreateParams.masterId"
      @back="onCreateBookingBack"
      @saved="onJournalCreateSaved"
    />
    <AggregatorFeedView
      v-else-if="currentSection === 'aggregator'"
      @back="closeAggregatorFeed"
      @navigate="handleDrawerNavigate"
    />
    <!-- Home: shared shell for identical layout with Mode selection -->
    <WowScreenShell
      v-else-if="currentSection === 'home'"
      :show-background="true"
      :show-profile-button="true"
      @profile-click="openAppDrawer"
    >
      <template #top-leading>
        <div class="top-leading-cluster">
          <SyncStatusBadge @open-sync="openSyncSettings" />
          <button
            type="button"
            class="notif-bell-btn"
            aria-label="Уведомления"
            @click="openNotificationsCenter"
          >
            <span class="notif-bell-icon" aria-hidden="true">{{ '\u{1F514}' }}</span>
            <span v-if="notificationsStore.unreadCount > 0" class="notif-bell-badge">
              {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
            </span>
          </button>
        </div>
      </template>
      <p
        v-if="authUserGreeting"
        class="text-center text-[11px] text-gray-500 font-medium mb-2 w-full max-w-sm px-2 shrink-0"
      >
        {{ authUserGreeting }}
      </p>
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
            data-testid="btn-open-analytics"
            class="wow-tile home-btn home-btn-primary"
            aria-label="Аналитика"
            @click="openAnalytics"
          >
            <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider">Аналитика</span>
            <span class="text-[10px] text-gray-500">PRO: выручка и конверсия</span>
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
            data-testid="btn-journal"
            class="wow-tile home-btn home-btn-primary relative"
            aria-label="Журнал записи"
            @click="openJournal"
          >
            <svg class="home-btn-icon w-8 h-8 text-metric-green shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="text-sm font-bold uppercase tracking-wider">Журнал записи</span>
            <span class="text-[10px] text-gray-500">Записи на ремонт</span>
            <span
              v-if="todayBookingsCount > 0"
              class="absolute top-2 right-2 min-w-[22px] min-h-[22px] px-1 rounded-full bg-metric-green text-black text-[10px] font-bold flex items-center justify-center leading-none"
            >{{ todayBookingsCount }}</span>
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
        @profile-click="openAppDrawer"
      >
        <template #top-leading>
          <div class="top-leading-cluster">
            <SyncStatusBadge @open-sync="openSyncSettings" />
            <button
              type="button"
              class="notif-bell-btn"
              aria-label="Уведомления"
              @click="openNotificationsCenter"
            >
              <span class="notif-bell-icon" aria-hidden="true">{{ '\u{1F514}' }}</span>
              <span v-if="notificationsStore.unreadCount > 0" class="notif-bell-badge">
                {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
              </span>
            </button>
          </div>
        </template>
        <template #subtitle>
          <h2 class="text-metric-green text-xs font-bold uppercase tracking-[0.2em]">ВЫБОР РЕЖИМА РАСЧЁТА</h2>
        </template>
        <p
          v-if="authUserGreeting"
          class="text-center text-[11px] text-gray-500 font-medium mb-2 w-full max-w-sm px-2 shrink-0"
        >
          {{ authUserGreeting }}
        </p>
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

          <div :class="(quickStep === 2 || (quickStep === 1 && !userSettings.showClientQuick)) ? 'space-y-0 pb-4' : (quickStep === 3 ? 'flex flex-col flex-auto min-h-0 pb-20' : 'space-y-4 pb-40')">
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
                    :phone-search-region="userSettings.regionCountry === 'BY' ? 'BY' : 'RU'"
                    @open-history="openClientHistory"
                    @open-client-profile="openClientProfileFromQuick"
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
                  <div
                    v-if="activeQuickDent?._paramsAutoCopied && !quickAutoCopyDismissed"
                    class="autocopy-pill"
                  >
                    <span>Параметры скопированы с предыдущей вмятины</span>
                    <button type="button" class="autocopy-pill__dismiss" @click="dismissQuickAutoCopyPill">
                      Изменить ✕
                    </button>
                  </div>
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
                    v-if="estimateDraft.quickDents.length >= 2"
                    type="button"
                    class="apply-all-btn"
                    :class="{ 'apply-all-btn--applied': quickApplyAllSuccess }"
                    @click="applyQuickParamsToAllDents"
                  >
                    {{ quickApplyAllSuccess ? '✓ Применено' : 'Скопировать на все ↪' }}
                  </button>
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
                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-metric-green/20 text-metric-green border border-metric-green/40 hover:bg-metric-green/30 transition-all touch-manipulation min-h-[44px] min-w-[44px]"
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

            <div v-else-if="quickStep === 3" class="qc-step3 qc-step3--tabbed flex flex-col min-h-0 flex-auto w-full">
              <StandardQuickFinalScreen
                class="w-full shrink-0"
                :unified-parent-scroll="true"
                :draft="estimateDraft"
                :engine-line-items="quickLineItems"
                :client-display="quickClientForDisplay"
                :user-settings="userSettings"
                :build-detailed-breakdown="buildDetailedBreakdown"
                :engine-dents-total="quickDmDentSubtotal"
                :detail-ux-parity="true"
                :session-display-currency="userSettings.regionCountry === 'BY' ? 'BYN' : 'RUB'"
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
        @open-order-document="handleOpenOrderDocument"
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
            <div class="quick-nav-price-value text-[17px] font-bold text-metric-green tabular-nums truncate">{{ formatMoneyWithCurrency(animatedQuickPrice, displayCurrencyForRegionCountry(userSettings.regionCountry)) }}</div>
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
        <div v-else class="qc-step3-actions flex flex-nowrap gap-0 min-w-0 items-stretch">
          <ShareButton compact class="shrink-0 mr-1 self-auto" :record="quickShareableRecord" />
          <PortalShareButton
            compact
            class="shrink-0 mr-1 self-auto"
            :record="quickShareableRecord"
            :estimate-id="estimateDraft.id"
          />
          <button
            type="button"
            class="shrink-0 self-auto min-w-[48px] min-h-[44px] py-2.5 px-1 text-[16px] leading-none border border-white/10 rounded-xl text-gray-200 touch-manipulation"
            aria-label="Заказ-наряд"
            @click="openQuickOrderDocument"
          >
            📋
          </button>
          <button
            type="button"
            @click="goQuickBack"
            class="qc-s3-btn qc-s3-btn--left flex-1 min-w-0 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[44px]"
          >
            Назад
          </button>
          <button
            data-testid="btn-save-estimate"
            type="button"
            @click="saveCurrentEstimate('quick')"
            class="qc-s3-btn qc-s3-btn--mid flex-1 min-w-0 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white border border-white/15 min-h-[44px] transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSavingHistory || !quickStep3Ready"
          >
            {{ isSavingHistory ? '...' : 'Сохранить' }}
          </button>
          <button
            type="button"
            @click="saveAndBookEstimate('quick')"
            class="qc-s3-btn qc-s3-btn--right flex-1 min-w-0 py-2.5 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 min-h-[44px] transition-colors hover:bg-metric-green/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
        :phone-search-region="userSettings.regionCountry === 'BY' ? 'BY' : 'RU'"
        @back="goHome"
        @select="selectedHistoryId = $event"
        @update-status="handleHistoryStatusUpdate"
        @clear-client-filter="historyClientPhoneFilter = ''"
        @open-client-profile="openClientProfileFromHistoryFilter"
        @request-backup-export="handleExportHistory"
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
      <div class="text-[11px] text-gray-500 uppercase tracking-widest px-1">{{ formatDateTime(selectedHistory.createdAt) }} · {{ selectedHistory.mode === 'detail' ? 'Детализация' : 'Быстрый расчёт' }}</div>
      <div
        v-if="!isEditingHistory && selectedHistory.isPriceManuallyAdjusted && selectedHistory.dmCalculatedPrice != null"
        class="text-[11px] text-amber-500/90 px-1 leading-snug"
      >
        Итог изменён вручную: расчёт DentMetric {{ formatHistoryMoney(selectedHistory.dmCalculatedPrice) }} → {{ formatHistoryMoney(historyDisplayTotal) }}
      </div>
      <ResultFourTabs v-model="historyFinalTab" class="history-final-tabs">
        <div class="hist-final-panels space-y-3 pb-2">
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
            <div
              v-if="!isEditingHistory && selectedHistory.recordRepairTimeHours != null && Number.isFinite(Number(selectedHistory.recordRepairTimeHours))"
              class="card-metallic rounded-2xl p-4"
            >
              <div class="flex justify-between text-sm gap-2">
                <span class="text-gray-400">Ориентировочное время ремонта</span>
                <span class="text-white font-semibold">{{ formatRepairTime(Number(selectedHistory.recordRepairTimeHours)) }}</span>
              </div>
            </div>
            <PerDentFinalCard
              v-for="(dentItem, idx) in historyDisplayLineItems"
              :key="dentItem.dent?.id || idx"
              :index="idx"
              :row="historyUiRowForPerDentCard(dentItem)"
              :breakdown-rows="buildDetailedBreakdownForHistory(dentItem)"
              :user-settings="userSettings"
              :engine-line-items="historyEngineLineItemsForDent(dentItem)"
              :read-only="!isEditingHistory"
              :detail-ux-parity="true"
              :history-display-currency="getRecordDisplayCurrency(selectedHistory)"
              @open-discount="openDiscountModal"
            />
            <div
              v-if="historyDisplayLineItems.length > 0 || historyAdditionalWorksSum > 0"
              class="card-metallic rounded-2xl p-4 space-y-2"
            >
              <div class="text-[10px] font-bold text-metric-green uppercase tracking-widest">Итого по заказу</div>
              <div v-if="historyDentsLineSum > 0" class="flex justify-between text-xs gap-2 text-gray-400">
                <span>Вмятины (расчёт)</span>
                <span class="text-white font-semibold tabular-nums shrink-0">{{ formatHistoryMoney(historyDentsLineSum) }}</span>
              </div>
              <div v-if="historyAdditionalWorksSum > 0" class="flex justify-between text-xs gap-2 text-gray-400">
                <span>Доп. работы</span>
                <span class="text-white font-semibold tabular-nums shrink-0">{{ formatHistoryMoney(historyAdditionalWorksSum) }}</span>
              </div>
              <div class="flex justify-between items-baseline gap-2 pt-1 border-t border-white/10">
                <span class="text-sm text-white font-bold">К оплате</span>
                <span class="text-lg font-extrabold text-metric-green tabular-nums">{{ formatHistoryMoney(historyDisplayTotal) }}</span>
              </div>
            </div>
            <PrepaymentBlock
              :model-value="isEditingHistory ? historyEditDraft.prepayment : (selectedHistory.prepayment ?? { amount: 0, method: null })"
              :readonly="!isEditingHistory"
              :display-currency="getRecordDisplayCurrency(selectedHistory)"
              @update:model-value="(v) => { if (isEditingHistory) historyEditDraft.prepayment = v; }"
            />
          </section>
          <section v-show="historyFinalTab === 'client'" class="hist-final-page space-y-3" aria-label="Клиент">
            <div v-if="isEditingHistory" class="card-metallic rounded-2xl p-4 space-y-3">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Данные клиента</div>
              <input v-model="historyEditDraft.clientName" type="text" placeholder="Имя" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
              <input v-model="historyEditDraft.clientPhone" type="tel" placeholder="Телефон" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
              <input v-model="historyEditDraft.clientCompany" type="text" placeholder="Компания" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
              <input v-model="historyEditDraft.carBrand" type="text" placeholder="Марка" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
              <input v-model="historyEditDraft.carModel" type="text" placeholder="Модель" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
              <input v-model="historyEditDraft.carPlate" type="text" placeholder="Гос. номер" class="w-full min-h-[44px] rounded-xl bg-[#151515] border border-[#333] px-3 text-sm text-white">
            </div>
            <template v-else>
              <div class="card-metallic rounded-2xl p-4 space-y-2">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Клиент</span>
                  <button type="button" class="text-[11px] font-bold uppercase tracking-wider text-metric-green min-h-[44px] px-2" @click="startHistoryEdit">Изменить</button>
                </div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Имя</span><span class="text-white text-right">{{ historyClientForDisplay.name || '—' }}</span></div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Телефон</span><span class="text-white text-right">{{ historyClientForDisplay.phone || '—' }}</span></div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Компания</span><span class="text-white text-right">{{ historyClientForDisplay.company || '—' }}</span></div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Марка</span><span class="text-white text-right">{{ historyClientForDisplay.brand || '—' }}</span></div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Модель</span><span class="text-white text-right">{{ historyClientForDisplay.model || '—' }}</span></div>
                <div class="flex justify-between text-sm gap-2"><span class="text-gray-500 shrink-0">Гос. номер</span><span class="text-white text-right">{{ selectedHistory.client?.plate || selectedHistory.client?.carPlate || '—' }}</span></div>
              </div>
              <div
                v-if="(historyClientForDisplay.phone || '').trim()"
                class="flex flex-col gap-2 card-metallic rounded-xl px-4 py-3"
              >
                <button
                  type="button"
                  class="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px]"
                  @click="openClientProfileFromHistoryDetail"
                >
                  Профиль клиента
                </button>
                <a
                  :href="`tel:${historyDetailTelHref}`"
                  class="px-4 py-2.5 rounded-lg text-xs font-bold bg-metric-green text-black border border-metric-green/40 touch-manipulation min-h-[44px] flex items-center justify-center"
                >Позвонить</a>
              </div>
            </template>
            <div class="card-metallic rounded-2xl p-4">
              <div class="flex justify-end mb-1">
                <button type="button" class="min-w-[44px] min-h-[44px] border-0 bg-transparent text-base opacity-80" aria-label="Справка: адекватность клиента" @click="historyAdequacyInfoOpen = !historyAdequacyInfoOpen">ℹ️</button>
              </div>
              <p v-if="historyAdequacyInfoOpen" class="text-xs text-gray-500 mb-3 leading-relaxed m-0">
                Оцените поведение клиента. Это поможет вам при повторных обращениях. Подробнее — в разделе «Инфо».
              </p>
              <ClientMoodPicker
                :hide-block-label="true"
                :model-value="isEditingHistory ? historyEditDraft.clientMood : (selectedHistory.clientMood ?? null)"
                @update:model-value="onHistoryMoodChange($event)"
              />
            </div>
          </section>
          <section v-show="historyFinalTab === 'files'" class="hist-final-page space-y-3" aria-label="Файлы">
            <template v-if="isEditingHistory">
              <div class="card-metallic rounded-2xl p-4 space-y-3">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Комментарий мастера</div>
                <textarea
                  v-model="historyEditDraft.comment"
                  class="w-full min-h-[100px] rounded-xl bg-[#151515] border border-[#333] px-3 py-3 text-sm text-white placeholder:text-gray-600 resize-y box-border"
                  placeholder="Добавить комментарий..."
                />
                <AttachmentPicker
                  :record-id="selectedHistory?.id || ''"
                  :dent-index="0"
                  :model-value="historyEditDraft.attachments"
                  @update:model-value="historyEditDraft.attachments = $event"
                />
              </div>
              <div v-if="!String(historyEditDraft.comment || '').trim() && !(historyEditDraft.attachments || []).length" class="text-center text-gray-500 text-sm py-6">
                Нет комментария и вложений
              </div>
            </template>
            <template v-else>
              <div v-if="selectedHistory.comment" class="card-metallic rounded-2xl p-4 space-y-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Комментарий</div>
                <div class="text-sm text-gray-300">{{ selectedHistory.comment }}</div>
              </div>
              <HistoryAttachmentsView v-if="(selectedHistory.attachments || []).length > 0" :attachments="selectedHistory.attachments" />
              <div v-if="!selectedHistory.comment && !(selectedHistory.attachments || []).length" class="text-center text-gray-500 text-sm py-10">
                Нет комментария и вложений
              </div>
            </template>
          </section>
          <section
            v-show="historyFinalTab === 'demo'"
            class="hist-final-page hist-final-page--demo card-metallic rounded-2xl p-6 text-center text-gray-500 text-sm"
            aria-label="Клиенту"
          >
            <p class="m-0 text-white/90 font-medium">Экран для клиента</p>
            <p class="text-xs mt-3 opacity-70 m-0 leading-relaxed">Раздел в разработке — здесь будет сценарий показа оценки клиенту.</p>
          </section>
        </div>
      </ResultFourTabs>
      </div>
      <!-- Sticky action bar: fixed above tab bar, always visible -->
      <div class="history-detail-actions">
        <div class="history-detail-actions__inner flex gap-2 p-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] bg-black border-t border-white/10">
          <button type="button" data-testid="btn-history-back" @click="selectedHistoryId = null" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/10 rounded-xl min-h-[44px]">Назад</button>
          <button v-if="!isEditingHistory" type="button" @click="startHistoryEdit" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px]">Редакт.</button>
          <button v-if="isEditingHistory" type="button" @click="cancelHistoryEdit" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/10 rounded-xl min-h-[44px]">Отмена</button>
          <button v-if="isEditingHistory" type="button" :disabled="isUpdatingHistory" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl min-h-[44px] disabled:opacity-50" @click="saveHistoryEdit">{{ isUpdatingHistory ? '...' : 'Сохранить' }}</button>
          <button v-if="!isEditingHistory" type="button" @click="deleteHistoryConfirm(selectedHistory.id)" class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-red-400 border border-red-500/40 rounded-xl min-h-[44px]">Удалить</button>
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
        <!-- Регион: отдельная карточка -->
        <div class="settings-section-card card-metallic rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div class="p-4 space-y-3">
            <div class="flex items-start gap-3">
              <span class="text-2xl leading-none" aria-hidden="true">🌍</span>
              <div class="min-w-0 flex-1">
                <div class="text-[11px] font-bold text-metric-green uppercase tracking-widest">Страна и валюта</div>
                <p class="text-[11px] text-gray-500 mt-1 leading-snug">
                  Телефон и поиск клиента, валюта новых записей в истории. Суммы в данных хранятся в рублях; для Беларуси показ — BYN (÷{{ BYN_PER_RUB }}).
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <label
                class="dm-region-card flex flex-col items-center justify-center gap-1 rounded-xl border min-h-[72px] cursor-pointer transition-colors touch-manipulation"
                :class="userSettings.regionCountry === 'RU' ? 'border-metric-green/50 bg-metric-green/10' : 'border-white/10 bg-[#141414] hover:border-white/15'"
              >
                <input v-model="userSettings.regionCountry" type="radio" value="RU" class="sr-only">
                <span class="text-lg" aria-hidden="true">🇷🇺</span>
                <span class="text-xs font-bold text-white">Россия</span>
              </label>
              <label
                class="dm-region-card flex flex-col items-center justify-center gap-1 rounded-xl border min-h-[72px] cursor-pointer transition-colors touch-manipulation"
                :class="userSettings.regionCountry === 'BY' ? 'border-metric-green/50 bg-metric-green/10' : 'border-white/10 bg-[#141414] hover:border-white/15'"
              >
                <input v-model="userSettings.regionCountry" type="radio" value="BY" class="sr-only">
                <span class="text-lg" aria-hidden="true">🇧🇾</span>
                <span class="text-xs font-bold text-white">Беларусь</span>
              </label>
            </div>
          </div>
        </div>
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
            <p class="settings-helper-text mb-2">Цены по зонам кузова. Пользовательские работы можно отнести к элементу — так проще ориентироваться в списках.</p>
            <template v-for="group in armatureSettingsGroups" :key="group.key">
              <div class="dm-settings-subsection-label">{{ group.label }}</div>
              <div v-for="w in group.works" :key="`${group.key}-${w.code}`" class="dm-settings-row">
                <div class="dm-settings-row__label-area">
                  <span class="dm-settings-row__label">{{ w.name }}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <input type="number" :value="effectiveArmaturePrice(w.code)" @input="setArmaturePriceOverride(w.code, $event.target.value)" inputmode="numeric" class="dm-number-input">
                  <span class="text-gray-500 text-sm">₽</span>
                </div>
              </div>
            </template>
            <div class="dm-settings-subsection-label">Пользовательские работы</div>
            <div v-for="(cw, idx) in userSettings.customArmatureWorks" :key="cw.id" class="dm-settings-row dm-settings-row--custom dm-settings-row--custom-stack">
              <div class="flex flex-wrap gap-2 w-full items-center">
                <input type="text" v-model="cw.name" placeholder="Название" class="dm-text-input flex-1 min-w-[120px]">
                <input type="number" v-model.number="cw.price" placeholder="₽" class="dm-number-input">
                <select v-model="cw.bodyElement" class="dm-text-input min-h-[44px] text-sm flex-1 min-w-[140px] bg-[#151515] border border-white/10 rounded-lg px-2 text-white">
                  <option v-for="b in BODY_ELEMENTS" :key="b.id" :value="b.id">{{ b.label }}</option>
                </select>
                <button type="button" @click="removeCustomArmatureWork(idx)" class="dm-settings-row__remove" aria-label="Удалить">✕</button>
              </div>
            </div>
            <div class="dm-settings-row dm-settings-row--add dm-settings-row--custom-stack">
              <div class="flex flex-wrap gap-2 w-full items-center">
                <input v-model="newArmatureWorkName" type="text" placeholder="Название" class="dm-text-input flex-1 min-w-[120px]">
                <input v-model.number="newArmatureWorkPrice" type="number" placeholder="₽" class="dm-number-input">
                <select v-model="newArmatureWorkBodyElement" class="dm-text-input min-h-[44px] text-sm flex-1 min-w-[140px] bg-[#151515] border border-white/10 rounded-lg px-2 text-white">
                  <option v-for="b in BODY_ELEMENTS" :key="'n-' + b.id" :value="b.id">{{ b.label }}</option>
                </select>
                <button type="button" @click="addCustomArmatureWork" class="dm-segment-btn dm-segment-btn--add">+</button>
              </div>
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

        <!-- 6b. Данные и резервная копия -->
        <div ref="(el) => setSettingsSectionRef('data-backup', el)" class="settings-section-card card-metallic rounded-2xl overflow-hidden">
          <div class="dm-section-header" :class="{ 'dm-section-header--open': settingsOpenSection === 'data-backup' }" @click="toggleSettingsSection('data-backup')">
            <div class="dm-section-header__left">
              <span class="dm-section-header__icon">💾</span>
              <span class="dm-section-header__title">Данные и резервная копия</span>
            </div>
            <span class="dm-section-header__chevron" :class="{ open: settingsOpenSection === 'data-backup' }">›</span>
          </div>
          <div v-show="settingsOpenSection === 'data-backup'" class="settings-section-content">
            <div class="dm-settings-row dm-settings-row--storage-bar">
              <span class="dm-settings-row__label">Использовано</span>
              <div class="storage-bar-wrap">
                <div
                  class="storage-bar-fill"
                  :style="{
                    width: backupStorageInfo.percent + '%',
                    background:
                      backupStorageInfo.status === 'critical'
                        ? 'var(--dm-danger, #e53935)'
                        : backupStorageInfo.status === 'warning'
                          ? '#fbbf24'
                          : 'var(--dm-accent, #a0e040)',
                  }"
                />
              </div>
              <span class="storage-bar-label">
                {{ backupStorageInfo.formattedUsed }} / {{ backupStorageInfo.formattedMax }}
              </span>
            </div>
            <div class="dm-settings-row">
              <span class="dm-settings-row__label">Записей в истории</span>
              <span class="dm-settings-row__value">{{ historyPinia.recordCount }}</span>
            </div>
            <button type="button" class="dm-btn dm-btn--secondary dm-btn--full mb-2" @click="handleExportHistory">
              Выгрузить историю (JSON)
            </button>
            <input
              ref="importFileRef"
              type="file"
              accept=".json,application/json"
              class="sr-only"
              aria-hidden="true"
              @change="handleImportFile"
            />
            <button type="button" class="dm-btn dm-btn--secondary dm-btn--full mb-2" @click="importFileRef?.click()">
              Загрузить из файла
            </button>
            <div
              v-if="importResultMessage"
              class="settings-import-result"
              :class="importResultIsError ? 'settings-import-result--error' : 'settings-import-result--ok'"
            >
              {{ importResultMessage }}
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
        class="bottom-nav-btn flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation"
        :class="currentSection === 'history' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'history' ? 'page' : undefined"
        :aria-label="currentSection === 'history' ? 'История (текущий раздел)' : 'История'"
      >
        <svg class="bottom-nav-ico bottom-nav-ico--brand" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M8 2v4M16 2v4M4 9h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="12" cy="14" r="3.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 12.2v1.8l1.2.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">История</span>
      </button>
      <button
        type="button"
        data-testid="nav-settings"
        @click="openSettingsHub"
        class="bottom-nav-btn flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation"
        :class="(currentSection === 'settings' || currentSection === 'settings-hub') ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="(currentSection === 'settings' || currentSection === 'settings-hub') ? 'page' : undefined"
        :aria-label="(currentSection === 'settings' || currentSection === 'settings-hub') ? 'Настройки (текущий раздел)' : 'Настройки'"
      >
        <svg class="bottom-nav-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Настройки</span>
      </button>
      <button
        type="button"
        data-testid="nav-metric"
        @click="openMetricMenu"
        class="bottom-nav-btn flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation"
        :class="currentSection === 'metric' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'metric' ? 'page' : undefined"
        :aria-label="currentSection === 'metric' ? 'Метрика (текущий раздел)' : 'Метрика'"
      >
        <svg class="bottom-nav-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 17V9M12 17V3M16 17v-5"/></svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Метрика</span>
      </button>
      <button
        type="button"
        data-testid="nav-info"
        @click="switchSection('info')"
        class="bottom-nav-btn flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation"
        :class="currentSection === 'info' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'info' ? 'page' : undefined"
        :aria-label="currentSection === 'info' ? 'Инфо (текущий раздел)' : 'Инфо'"
      >
        <svg class="bottom-nav-ico bottom-nav-ico--brand" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.5 5.5h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/>
          <path d="M12 10v5M12 8.2h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Инфо</span>
      </button>
      <button
        type="button"
        data-testid="nav-home"
        @click="goHome"
        class="bottom-nav-btn flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-200 min-h-[56px] touch-manipulation"
        :class="currentSection === 'home' ? 'bottom-nav-btn--active' : 'bottom-nav-btn--idle'"
        :aria-current="currentSection === 'home' ? 'page' : undefined"
        :aria-label="currentSection === 'home' ? 'Домой (текущий раздел)' : 'Домой'"
      >
        <svg class="bottom-nav-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>
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
    <AppDrawer
      v-model="drawerOpen"
      :current-section="currentSection"
      @navigate="handleDrawerNavigate"
    />
    <NotificationsSettingsView
      v-if="currentSection === 'notifications-settings'"
      @back="closeNotificationsSettings"
    />
    <NotificationCenterView
      v-if="currentSection === 'notifications'"
      @back="closeNotificationsCenter"
      @open-booking="onNotificationOpenBooking"
    />
    <ServiceDataView
      v-if="currentSection === 'service-data'"
      @back="handleServiceDataBack"
    />
    <MarketPricesSettingsView
      v-if="currentSection === 'market-prices'"
      @back="closeMarketPricesSettings"
      @apply-prices="handleApplyMarketPricesFromMarket"
    />
    <OrderDocumentView
      v-if="currentSection === 'order-document' && currentOrderDoc"
      :key="currentOrderDoc.id"
      :doc="currentOrderDoc"
      @back="closeOrderDocument"
      @signed="handleDocumentSigned"
    />
    <MasterStatsDashboard
      v-if="currentSection === 'analytics'"
      @back="closeAnalyticsDashboard"
      @navigate="onMasterStatsNavigate"
    />
    <ClientProfileView
      v-if="currentSection === 'client-profile' && clientProfilePhone"
      :key="clientProfilePhone"
      :phone="clientProfilePhone"
      @back="closeClientProfile"
      @open-record="onClientProfileOpenRecord"
      @new-estimate="onClientProfileNewEstimate"
    />
    <MarketPricesConsentDialog
      :visible="showMarketConsentDialog"
      @accept="handleMarketConsentAccept"
      @decline="handleMarketConsentDecline"
      @dismiss="showMarketConsentDialog = false"
    />
    <PaywallModal :visible="paywallVisible" :min-plan="paywallMinPlan" @close="closePaywall" @go-plans="switchSection('plans'); closePaywall();" />
    <NotificationStack />
    <InputModal :model-value="inputModalOpen" :config="inputModalConfig" @confirm="inputModalConfirm" @cancel="inputModalCancel" />
    <SelectModal :model-value="selectModalOpen" :config="selectModalConfig" @confirm="selectModalConfirm" @cancel="selectModalCancel" />
    <PresetsModal v-model="presetsModalOpen" @select="onPresetSelected" />
    <component :is="QAOverlayComp" v-if="qaEnabled && QAOverlayComp" />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick, onBeforeUnmount, provide, defineAsyncComponent } from 'vue';
import { storeToRefs } from 'pinia';
import { deleteSelected } from './graphics/konvaEditor';
import { initialData } from './data/initialData';
import {
  formatArmaturnayaSummary,
  getArmaturnayaWorksForElement,
  getArmaturnayaTotalPrice,
  getAllSystemArmatureWorks,
  getArmatureSettingsGroups,
} from './data/armaturnayaWorks';
import { BODY_ELEMENTS, normalizeArmatureBodyElement } from './constants/bodyElements';
import { normalizeArmatureWorkIds, toggleArmatureWorkIds } from './utils/armatureSelection';
import { CAR_PARTS } from './data/carParts';
import { getPartsByClass } from './data/partsCatalog';
import { circleSizesMm, stripSizesMm, circleSizesWithArea, stripSizesWithArea } from './data/dentSizes';
import { calcBasePriceFromDents, calcTotalPrice, buildBreakdown } from './utils/priceCalc';
import {
  calculateDentPrice as calcDentViaAdapter,
  normalizeGraphicsDentsForPricing,
  normalizeDimensions,
  isStripeCase,
} from './features/pricing/pricingAdapter';
import { resolveDentShapeType, getResolvedShapeDisplayLabel } from './utils/resolveDentShapeType';
import { applyPriceRoundingCeil, PRICE_ROUND_OPTIONS } from './utils/priceRounding';
import { applyDiscount, clampDiscount } from './utils/discount';
import { calculateEstimateTotals } from './utils/calculateEstimateTotals';
import { formatRepairTime } from './utils/formatRepairTime';
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
import { generateRecordId, StorageFullError } from './features/history/historyStore';
import { useHistoryPiniaStore } from './stores/history';
import { migrateLegacyPhotosToIdb } from './utils/migratePhotosToIdb';
import {
  exportHistoryToJSON,
  importHistoryFromJSON,
  cleanupImportBackups,
  STORAGE_KEY as HISTORY_LOCAL_STORAGE_KEY,
} from './utils/historyIO';
import { getHistoryStorageInfo } from './utils/storageUtils';
import PwaInstallPrompt from './components/PwaInstallPrompt.vue';
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
import ClientFoundCard from './components/ClientFoundCard.vue';
import MasterStatsDashboard from './views/analytics/MasterStatsDashboard.vue';
import ClientProfileView from './views/crm/ClientProfileView.vue';
import StandardQuickFinalScreen from './components/result/StandardQuickFinalScreen.vue';
import ShareButton from './components/ShareButton.vue';
import PortalShareButton from './components/PortalShareButton.vue';
import AggregatorFeedView from './views/aggregator/AggregatorFeedView.vue';
import PerDentFinalCard from './components/result/PerDentFinalCard.vue';
import ResultFourTabs from './components/result/ResultFourTabs.vue';
import { useClientSearch } from './composables/useClientSearch';
import { calcPostSaveAnalytics, applyClientFields, normalizePhone } from './utils/clientSearch';
import {
  getRecordDisplayCurrency,
  formatMoneyWithCurrency,
  displayCurrencyForRegionCountry,
  BYN_PER_RUB,
} from './utils/regionFormat';
import { formatPhoneDisplayBelarus, normalizePhoneForInput } from './utils/phoneFormat';
import { saveAttachment, generateAttachmentKey } from './utils/attachmentStorage';
import ClientMoodPicker from './components/ClientMoodPicker.vue';
import PrepaymentBlock from './components/PrepaymentBlock.vue';
import { useAccount } from './modules/account/useAccount';
import { useAuthStore } from './stores/auth';
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
import AppDrawer from './components/AppDrawer.vue';
import ProfileView from './views/profile/ProfileView.vue';
import SettingsHubView from './views/settings/SettingsHubView.vue';
import SettingsPlaceholder from './views/settings/SettingsPlaceholder.vue';
import EmployeesListView from './views/employees/EmployeesListView.vue';
import EmployeeCardView from './views/employees/EmployeeCardView.vue';
import JournalView from './views/journal/JournalView.vue';
import BookingDetailView from './views/journal/BookingDetailView.vue';
import CreateBookingView from './views/journal/CreateBookingView.vue';
import NotificationsSettingsView from './views/settings/NotificationsSettingsView.vue';
import NotificationCenterView from './views/notifications/NotificationCenterView.vue';
import ServiceDataView from './views/settings/ServiceDataView.vue';
import MarketPricesSettingsView from './views/settings/MarketPricesSettingsView.vue';
import MarketPricesConsentDialog from './components/MarketPricesConsentDialog.vue';
import { useMarketPricesStore } from './stores/marketPrices';
import { isSupabaseConfigured } from './services/supabase';
import SyncSettingsView from './views/settings/SyncSettingsView.vue';
import SyncStatusBadge from './components/sync/SyncStatusBadge.vue';
import OrderDocumentView from './views/document/OrderDocumentView.vue';
import { useBookingsStore } from './stores/bookings';
import { useServiceDataStore } from './stores/serviceData';
import { useNotificationsStore } from './stores/notifications';
import { useSyncStore } from './stores/sync';
import { buildOrderDocument } from './utils/buildOrderDocument';
import {
  checkAndFireDueNotifications,
  tryFireDailyDigest,
  rescheduleAllActiveBookings,
  loadNotificationSettings,
} from './services/notificationEngine';

const account = useAccount();
const authStore = useAuthStore();
const authUserGreeting = computed(() => authStore.user?.name?.trim() || '');
const { requireFeature, checkHistoryLimit, paywallVisible, paywallMinPlan, closePaywall } = useFeatureGate();

const bookingsStore = useBookingsStore();
const serviceDataStore = useServiceDataStore();
const notificationsStore = useNotificationsStore();
const syncStore = useSyncStore();
const marketPricesStore = useMarketPricesStore();
const showMarketConsentDialog = ref(false);
const SAVE_COUNT_KEY = 'dm_market_save_count';
const notificationsPreviousSection = ref(null);
const isOnlineState = ref(typeof navigator !== 'undefined' && navigator.onLine);

function onAppOnline() {
  isOnlineState.value = true;
  syncStore.updatePendingCount();
}

function onAppOffline() {
  isOnlineState.value = false;
}

const clientProfilePhone = ref('');
const clientProfileReturn = ref({ section: 'home', historyId: null });
let notifPollIntervalId = null;
let marketPricesPollId = null;
const todayBookingsCount = computed(() => bookingsStore.todayBookings.length);
const journalBookingId = ref(null);
const journalCreateParams = ref(null);
const currentOrderDoc = ref(null);
const orderDocPreviousSection = ref(null);

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
const drawerOpen = ref(false);
const sectionBeforeProfile = ref('home');
const syncSettingsReturnSection = ref('settings-hub');
const hubPlaceholderTitle = ref('');
const hubPlaceholderMessage = ref('');
const hubPlaceholderReturnSection = ref('settings-hub');
const employeeViewId = ref(null);

const HUB_PLACEHOLDER_TITLES = {
  'online-booking': 'Онлайн-запись',
  security: 'Безопасность',
  help: 'Помощь',
};

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
function openSettingsSection(id) {
  settingsOpenSection.value = id;
  nextTick(() => {
    const el = settingsSectionRefs[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
function toggleSettingsSection(id) {
  if (settingsOpenSection.value === id) {
    settingsOpenSection.value = null;
  } else {
    openSettingsSection(id);
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

const historyPinia = useHistoryPiniaStore();
const { records: historyItems } = storeToRefs(historyPinia);
const { loadHistory, saveEstimate, updateEstimate, deleteEstimate, clearHistory } = historyPinia;
const selectedHistoryId = ref(null);
const historyFinalTab = ref('calculation');

const { foundClient, searchByPhone, clearSearch } = useClientSearch(() => loadHistory(), () =>
  userSettings.regionCountry === 'BY' ? 'BY' : 'RU'
);
const historyClientPhoneFilter = ref('');
const postSaveAnalytics = ref(null);

const importFileRef = ref(null);
const importResultMessage = ref('');
const importResultIsError = ref(false);
const backupStorageInfo = ref(getHistoryStorageInfo());
function refreshBackupStorageInfo() {
  backupStorageInfo.value = getHistoryStorageInfo();
}
const pwaNeedRefresh = ref(false);
const pwaUpdateSW = ref(null);
function pwaReload() {
  if (pwaUpdateSW.value) void pwaUpdateSW.value(true);
}

async function handleExportHistory() {
  try {
    const list = [...(historyItems.value || [])];
    await exportHistoryToJSON(list);
    showToast('Экспортировано ' + list.length + ' записей', 'success', 2200);
    refreshBackupStorageInfo();
  } catch (err) {
    console.error('[Export] Failed:', err);
    showToast('Ошибка экспорта', 'error');
  }
}

async function handleImportFile(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const confirmed = confirm(
    `Импортировать историю из файла "${file.name}"?\n` +
      'Режим: добавить к существующим (дубли пропускаются)'
  );
  if (!confirmed) {
    if (importFileRef.value) importFileRef.value.value = '';
    return;
  }
  importResultMessage.value = '';
  importResultIsError.value = false;
  try {
    const { records: merged, result } = await importHistoryFromJSON(
      file,
      'merge',
      [...(historyItems.value || [])],
      HISTORY_LOCAL_STORAGE_KEY
    );
    historyPinia.safeSaveHistory(merged, { allowEviction: true });
    loadHistory(true);
    refreshBackupStorageInfo();
    importResultMessage.value =
      `Импортировано: ${result.imported}, пропущено: ${result.skipped}` +
      (result.errors > 0 ? `, ошибок: ${result.errors}` : '');
    importResultIsError.value = result.errors > 0 && result.imported === 0;
    showToast(`Импортировано ${result.imported} записей`, 'success', 2200);
  } catch (err) {
    importResultMessage.value = 'Ошибка импорта файла';
    importResultIsError.value = true;
    showToast('Ошибка импорта', 'error');
    console.error('[Import] Failed:', err);
  } finally {
    if (importFileRef.value) importFileRef.value.value = '';
  }
}

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

function openAnalytics() {
  currentSection.value = 'analytics';
  haptic('selection');
}

function closeAnalyticsDashboard() {
  currentSection.value = 'home';
}

function onMasterStatsNavigate(section) {
  if (section === 'tariffs') switchSection('plans');
}

function openClientProfileFromQuick(phone) {
  clientProfileReturn.value = { section: currentSection.value, historyId: null };
  clientProfilePhone.value = phone;
  currentSection.value = 'client-profile';
}

function openClientProfileFromHistoryFilter(phoneDigits) {
  clientProfileReturn.value = { section: 'history', historyId: selectedHistoryId.value };
  clientProfilePhone.value = phoneDigits;
  currentSection.value = 'client-profile';
}

function openClientProfileFromHistoryDetail() {
  const rec = selectedHistory.value;
  if (!rec) return;
  const raw = String(rec.client?.phone ?? rec.clientPhone ?? '').trim();
  const reg = userSettings.regionCountry === 'BY' ? 'BY' : 'RU';
  const n = normalizePhone(raw, reg);
  if (n.length < 10) return;
  clientProfileReturn.value = { section: 'history', historyId: selectedHistoryId.value };
  clientProfilePhone.value = n;
  currentSection.value = 'client-profile';
}

function closeClientProfile() {
  const ret = clientProfileReturn.value;
  const back = ret.section && ret.section !== 'client-profile' ? ret.section : 'history';
  currentSection.value = back;
  if (ret.historyId) selectedHistoryId.value = ret.historyId;
  clientProfilePhone.value = '';
  clientProfileReturn.value = { section: 'home', historyId: null };
}

function onClientProfileOpenRecord(id) {
  clientProfilePhone.value = '';
  clientProfileReturn.value = { section: 'home', historyId: null };
  selectedHistoryId.value = id;
  currentSection.value = 'history';
}

function onClientProfileNewEstimate(phone) {
  estimateDraft.clientPhone = phone;
  clearSearch();
  calcMode.value = 'standard';
  quickStep.value = 1;
  clientProfilePhone.value = '';
  clientProfileReturn.value = { section: 'home', historyId: null };
  currentSection.value = 'metric';
  ensureInspectDateTime();
  haptic('selection');
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
  historyAdequacyInfoOpen.value = false;
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
        sizeCode: item.sizeCode ?? dent.sizeCode,
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
    const dt = String(d?.type || d?.shape || '').toLowerCase();
    const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => dt.includes(k));
    const shape = wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const conditions = userSettings.showPaintMaterial !== false
      ? (d.conditions || {})
      : { ...(d.conditions || {}), paintMaterialCode: null };
    const result = calcDentViaAdapter(
      { shape, widthMm: w, heightMm: hh, conditions, panelElement: d.panelElement || null },
      ctx
    );
    const multType = isStripeCase(shape, w, hh) ? 'strip' : 'circle';
    const mult = getPriceMultiplier(multType, userSettings);
    recomputed.push({
      id: d.id ?? `d${i}`,
      dent: d,
      base: (result.base || 0) * mult,
      total: (result.total || 0) * mult,
      sizeCode: result.sizeCode,
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
      return {
        dent: dentDisplay,
        base,
        sizeCode: dent.sizeCode || 'STRIP_DEFAULT',
        breakdown: paramItems,
        appliedTotal: applied,
        preDiscountTotal: subtotal,
        discountPercent: discPct,
        discountAmount
      };
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
      sizeCode: r.sizeCode ?? dentDisplay.sizeCode,
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
/** Как на финальном экране детализации: учитываем legacy clientName / carBrand и т.д. */
const historyClientForDisplay = computed(() => {
  const rec = selectedHistory.value;
  const c = rec?.client || {};
  const rawPhone = String(c.phone ?? c.clientPhone ?? '').trim();
  const phone =
    getRecordDisplayCurrency(rec) === 'BYN' && rawPhone ? formatPhoneDisplayBelarus(rawPhone) : rawPhone;
  return {
    name: String(c.name ?? c.clientName ?? '').trim(),
    phone,
    brand: String(c.brand ?? c.carBrand ?? '').trim(),
    model: String(c.model ?? c.carModel ?? '').trim(),
    company: String(c.company ?? c.clientCompany ?? '').trim(),
  };
});
const historyDetailTelHref = computed(() => {
  const rec = selectedHistory.value;
  const p = String(rec?.client?.phone ?? rec?.clientPhone ?? '').trim();
  const raw = p.replace(/\D/g, '');
  if (!raw) return '';
  if (getRecordDisplayCurrency(rec) === 'BYN') {
    const n = normalizePhone(p, 'BY');
    return n.startsWith('375') ? `+${n}` : `+${raw}`;
  }
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
  attachments: [],
  /** Ориентировочное время ремонта (ч), как в расчёте */
  recordRepairTimeHours: null,
  /** Копия line items для инлайн-редактирования вкладки «Расчёт» */
  editLineItems: null
});
const historyAdequacyInfoOpen = ref(false);

const historyDisplayLineItems = computed(() => {
  if (isEditingHistory.value && Array.isArray(historyEditDraft.editLineItems) && historyEditDraft.editLineItems.length > 0) {
    return historyEditDraft.editLineItems;
  }
  return historyLineItems.value;
});

const historyAdditionalWorksSum = computed(() => {
  const rec = selectedHistory.value;
  const works = rec?.additionalWorks;
  if (!Array.isArray(works)) return 0;
  return works.reduce((s, w) => s + (Number(w.price) || 0), 0);
});

const historyDentsLineSum = computed(() => {
  const items = historyDisplayLineItems.value;
  if (!items?.length) return 0;
  return items.reduce((s, i) => s + (Number(i.appliedTotal) || 0), 0);
});

const historyComputedOrderTotal = computed(() => historyDentsLineSum.value + historyAdditionalWorksSum.value);

function formatHistoryMoney(amountRub) {
  return formatMoneyWithCurrency(Number(amountRub) || 0, getRecordDisplayCurrency(selectedHistory.value));
}

/** Итог по истории: ручная правка > сумма вмятин + доп. работы > сохранённый total. */
const historyDisplayTotal = computed(() => {
  const rec = selectedHistory.value;
  if (isEditingHistory.value && historyEditDraft.editManualPrice != null && Number(historyEditDraft.editManualPrice) > 0) {
    return Number(historyEditDraft.editManualPrice) || 0;
  }
  if (!isEditingHistory.value && rec?.isPriceManuallyAdjusted && rec.manualAdjustedPrice != null) {
    return Number(rec.manualAdjustedPrice) || 0;
  }
  const fromParts = historyComputedOrderTotal.value;
  if (fromParts > 0) return fromParts;
  const items = historyDisplayLineItems.value;
  if (items?.length > 0) {
    const sum = items.reduce((s, i) => s + (Number(i.appliedTotal) || 0), 0);
    if (sum > 0) return sum;
  }
  return rec?.total ?? 0;
});

/**
 * При редактировании записи в истории: пересчёт appliedTotal по сохранённому preDiscountTotal
 * и текущему per-dent discountPercent (скидка через модалку мутирует dent; watch пересчитывает суммы).
 */
function resolveHistoryLineSubtotalForEdit(item) {
  const pre = Number(item.preDiscountTotal);
  if (Number.isFinite(pre) && pre > 0) return pre;
  const app = Number(item.appliedTotal) || 0;
  const da = Number(item.discountAmount);
  if (Number.isFinite(da) && da >= 0 && app >= 0) return app + da;
  const pct = clampDiscount(item.dent?.discountPercent ?? item.discountPercent ?? 0);
  if (pct > 0 && pct < 100 && app > 0) return Math.round((app * 100) / (100 - pct));
  return Math.max(0, app);
}

function recalcHistoryEditLineTotals(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const roundStep = userSettings.priceRoundStep ?? 0;
  const dentInputs = items.map((item, idx) => ({
    id: String(item.dent?.id ?? `idx_${idx}`),
    basePrice: Number(item.base) || 0,
    subtotal: resolveHistoryLineSubtotalForEdit(item),
    discountPercent: clampDiscount(item.dent?.discountPercent ?? item.discountPercent ?? 0)
  }));
  const totals = calculateEstimateTotals(dentInputs, 0);
  items.forEach((item, idx) => {
    const t = totals.dents[idx];
    if (!t) return;
    item.discountPercent = t.discountPercent;
    item.discountAmount = t.discountAmount;
    item.appliedTotal =
      roundStep > 0 ? applyPriceRoundingCeil(t.final, roundStep) : Math.round(t.final);
    item.rawDiscounted = t.final;
  });
}

watch(
  () =>
    isEditingHistory.value && Array.isArray(historyEditDraft.editLineItems)
      ? historyEditDraft.editLineItems
          .map((i, idx) => `${i?.dent?.id ?? idx}:${Number(i?.dent?.discountPercent ?? i?.discountPercent ?? 0)}`)
          .join('|')
      : '',
  (sig, prev) => {
    if (!sig || sig === prev) return;
    if (isEditingHistory.value && Array.isArray(historyEditDraft.editLineItems)) {
      recalcHistoryEditLineTotals(historyEditDraft.editLineItems);
    }
  }
);

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

const quickAutoCopyDismissed = ref(false);
const quickApplyAllSuccess = ref(false);

watch(activeQuickDentId, () => {
  quickAutoCopyDismissed.value = false;
});

function dismissQuickAutoCopyPill() {
  quickAutoCopyDismissed.value = true;
  const d = activeQuickDent.value;
  if (d) d._paramsAutoCopied = false;
}

function applyQuickParamsToAllDents() {
  const source = activeQuickDent.value;
  if (!source?.conditions || estimateDraft.quickDents.length < 2) return;
  const c = source.conditions;
  estimateDraft.quickDents.forEach((dent) => {
    if (dent.id === source.id) return;
    if (!dent.conditions) dent.conditions = {};
    dent.conditions.repairCode = c.repairCode;
    dent.conditions.riskCode = c.riskCode;
    dent.conditions.materialCode = c.materialCode;
    dent.conditions.carClassCode = c.carClassCode;
    dent.conditions.paintMaterialCode = c.paintMaterialCode;
    dent.conditions.soundInsulationCode = c.soundInsulationCode;
    dent.conditions.disassemblyCodes = Array.isArray(c.disassemblyCodes)
      ? [...c.disassemblyCodes]
      : ['Z0'];
  });
  quickApplyAllSuccess.value = true;
  setTimeout(() => {
    quickApplyAllSuccess.value = false;
  }, 2000);
  haptic('selection');
}

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
  const list = estimateDraft.quickDents;
  const prev = list.length ? list[list.length - 1] : null;
  const next = createQuickDent(null);
  next.panelSide = 'left';
  next.panelElement = null;
  next.shape = 'circle';
  next.sizeInputMode = 'preset';
  next.sizeCode = null;
  next.sizeLengthMm = null;
  next.sizeWidthMm = null;
  if (prev?.conditions) {
    const p = prev.conditions;
    next.conditions = {
      repairCode: p.repairCode,
      riskCode: p.riskCode,
      materialCode: p.materialCode,
      carClassCode: p.carClassCode,
      disassemblyCodes: Array.isArray(p.disassemblyCodes) ? [...p.disassemblyCodes] : ['Z0'],
      paintMaterialCode: p.paintMaterialCode,
      soundInsulationCode: p.soundInsulationCode,
    };
    next._paramsAutoCopied = true;
  } else {
    next._paramsAutoCopied = false;
  }
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
  /** RU | BY — телефон, поиск, новые записи истории */
  regionCountry: 'RU',
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
    if (Array.isArray(p.customArmatureWorks)) {
      userSettings.customArmatureWorks = p.customArmatureWorks.map((c) => ({
        ...c,
        bodyElement: normalizeArmatureBodyElement(c?.bodyElement)
      }));
    }
    if (p.armaturePriceOverrides && typeof p.armaturePriceOverrides === 'object') userSettings.armaturePriceOverrides = p.armaturePriceOverrides;
    userSettings.priceAdjustmentRoundOval = migrated.priceAdjustmentRoundOval ?? 1.0;
    userSettings.priceAdjustmentStripe = migrated.priceAdjustmentStripe ?? 1.0;
    userSettings.discountSamePartEnabled = migrated.discountSamePartEnabled ?? false;
    userSettings.discountSamePartValue = migrated.discountSamePartValue ?? 50;
    userSettings.discountDiffPartEnabled = migrated.discountDiffPartEnabled ?? false;
    userSettings.discountDiffPartValue = migrated.discountDiffPartValue ?? 0;
    userSettings.regionCountry = migrated.regionCountry === 'BY' ? 'BY' : 'RU';
    const validated = validateSettings({ ...userSettings });
    userSettings.priceAdjustmentRoundOval = validated.priceAdjustmentRoundOval;
    userSettings.priceAdjustmentStripe = validated.priceAdjustmentStripe;
    userSettings.discountSamePartValue = validated.discountSamePartValue;
    userSettings.discountDiffPartValue = validated.discountDiffPartValue;
  } catch (e) {
    if (import.meta.env?.DEV) console.error('Failed to load settings', e);
  }
  mergeMissingPricesFromDefaults();
}
/** Подставить базовые цены из каталога, если в сохранённых настройках нет ключа (иначе регулятор цен не срабатывает). */
function mergeMissingPricesFromDefaults() {
  const defs = buildDefaultPrices();
  for (const k of Object.keys(defs)) {
    const cur = userSettings.prices[k];
    if (cur == null || cur === '' || !Number.isFinite(Number(cur))) {
      userSettings.prices[k] = defs[k];
    }
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
  const st = String(dent.shape || '').toLowerCase();
  const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => st.includes(k));
  const shape = wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
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
  const multType = isStripeCase(shape, w, h) ? 'strip' : 'circle';
  const mult = getPriceMultiplier(multType, userSettings);
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

const quickDefaultRepairHours = computed(() => {
  const total = quickDmDentSubtotal.value;
  const rate = userSettings.hourlyRate > 0 ? userSettings.hourlyRate : 4000;
  if (total <= 0 || rate <= 0) return 0;
  return Math.round((total / rate) * 100) / 100;
});

const quickDisplayRepairHours = computed(() => {
  const m = estimateDraft.repairTimeHours;
  if (m != null && m !== '' && Number.isFinite(Number(m))) return Number(m);
  return quickDefaultRepairHours.value;
});

const quickShareableRecord = computed(() => ({
  client: {
    name: estimateDraft.clientName || '',
    phone: estimateDraft.clientPhone || '',
    brand: estimateDraft.carBrand || '',
    model: estimateDraft.carModel || '',
    plate: estimateDraft.carPlate || '',
  },
  total: quickWorksheetGrandTotal.value,
  currency: displayCurrencyForRegionCountry(userSettings.regionCountry),
  dents: quickLineItems.value.map((item) => {
    const dent = item.dent;
    return {
      panelElement: dent?.panelElement ?? undefined,
      length:
        dent?.sizeLengthMm != null && Number.isFinite(Number(dent.sizeLengthMm))
          ? Number(dent.sizeLengthMm)
          : undefined,
      width:
        dent?.sizeWidthMm != null && Number.isFinite(Number(dent.sizeWidthMm))
          ? Number(dent.sizeWidthMm)
          : undefined,
      total: quickEffectiveDentLineTotal(item),
    };
  }),
  repairTimeHours:
    quickDisplayRepairHours.value > 0 ? quickDisplayRepairHours.value : undefined,
  masterName: estimateDraft.masterName,
  comment: estimateDraft.comment,
}));

/** Клиент для итогового экрана (вкладка «Клиент») в быстром расчёте. */
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
    const bbox = d?.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const h = Number(bbox.height) || 0;
    const resolved = w > 0 && h > 0 ? resolveDentShapeType(w, h) : null;
    const t = String(d?.type || '').toLowerCase();
    const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => t.includes(k));
    const shape = d?.type === 'freeform' ? 'circle' : wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const multType = isStripeCase(shape, w, h) ? 'strip' : 'circle';
    const mult = getPriceMultiplier(multType, userSettings);
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

/** Ориентировочное время ремонта (человекочитаемо: ч + мин, не «8,95 ч»). */
const estimatedRepairTime = computed(() => {
  const total = displayTotal.value;
  const rate = userSettings.hourlyRate > 0 ? userSettings.hourlyRate : 4000;
  if (total <= 0 || rate <= 0) return '—';
  return formatRepairTime(total / rate);
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
  return buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary, { namedArmatureLines: true });
}

function buildDetailedBreakdownForHistory(dentItem) {
  return buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary, { namedArmatureLines: true });
}

/** Строка вмятины для карточки итога (как на экране расчёта), для просмотра в истории */
function historyUiRowForPerDentCard(dentItem) {
  const dent = dentItem?.dent;
  const dm = dentItem?.appliedTotal ?? 0;
  const step = userSettings.priceRoundStep ?? 0;
  const rawM = dent?.manualLineTotal;
  const manual =
    rawM != null && rawM !== '' && Number.isFinite(Number(rawM))
      ? applyPriceRoundingCeil(Number(rawM), step)
      : null;
  const displayTotal = manual != null ? manual : dm;
  const market =
    dent?.marketLinePrice != null && Number.isFinite(Number(dent.marketLinePrice))
      ? Number(dent.marketLinePrice)
      : displayTotal;
  return {
    ...dentItem,
    dmTotal: dm,
    displayTotal,
    hasManual: manual != null,
    marketDisplay: market
  };
}

function historyEngineLineItemsForDent(dentItem) {
  const id = dentItem?.dent?.id;
  return [
    {
      dent: dentItem?.dent,
      appliedTotal: dentItem?.appliedTotal ?? 0
    }
  ].filter((x) => x.dent);
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
    const p = value === '' || value === null ? null : clampDiscount(value);
    dent.discountPercent = p;
    if (dent?.id != null) {
      if (!estimateDraft.dentDiscounts) estimateDraft.dentDiscounts = {};
      estimateDraft.dentDiscounts[dent.id] = p;
    }
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
    const ctx = {
      sizesWithArea: shape === 'circle' ? circleSizesWithArea : stripSizesWithArea,
      circleSizesWithArea,
      stripSizesWithArea,
      prices: userSettings.prices,
      initialData,
      roundStep: 100
    };
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

function   applyPriceRegulator(type, percentDelta) {
  // +10% / −10%: добавляют/вычитают 10 п.п. от базы (100→110→120…). 0%: сброс к 100%.
  mergeMissingPricesFromDefaults();
  const sizes = type === 'roundOval' ? initialData.circleSizes : initialData.stripSizes;
  const snapshot = {};
  sizes.forEach((s) => {
    const v = userSettings.prices[s.code];
    if (v != null && Number.isFinite(Number(v))) snapshot[s.code] = Number(v);
  });
  if (Object.keys(snapshot).length === 0) return;

  const prevRoundAdj = Number(userSettings.priceAdjustmentRoundOval) || 1;
  const prevStripeAdj = Number(userSettings.priceAdjustmentStripe) || 1;

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
  /*
   * Регулятор меняет цены в каталоге; расчёт полосы берёт их из userSettings.prices напрямую.
   * Сбрасываем priceAdjustment*, иначе множитель в настройках дублирует эффект и расходится с «Множитель: N%».
   */
  if (type === 'roundOval') userSettings.priceAdjustmentRoundOval = 1;
  else userSettings.priceAdjustmentStripe = 1;
  saveSettings();
  haptic('success');
  const label = percentDelta > 0 ? '+10%' : (percentDelta < 0 ? '−10%' : '0%');
  const section = type === 'roundOval' ? 'Круг/Овал' : 'Полоса/Царапина';
  showUndoToast(`${section}: цены ${label}`, () => {
    sizes.forEach((s) => { if (snapshot[s.code] != null) userSettings.prices[s.code] = snapshot[s.code]; });
    userSettings.priceAdjustmentRoundOval = prevRoundAdj;
    userSettings.priceAdjustmentStripe = prevStripeAdj;
    saveSettings();
    haptic('success');
  });
}

function startHistoryEdit() {
  if (!selectedHistory.value) return;
  const rec = selectedHistory.value;
  const client = rec.client || {};
  historyEditDraft.clientName = client.name || '';
  historyEditDraft.clientCompany = client.company || client.clientCompany || '';
  historyEditDraft.clientPhone = client.phone || client.clientPhone || '';
  historyEditDraft.clientMood = rec.clientMood ?? null;
  historyEditDraft.carBrand = client.brand || client.carBrand || '';
  historyEditDraft.carModel = client.model || client.carModel || '';
  historyEditDraft.carPlate = client.plate || client.carPlate || '';
  historyEditDraft.inspectDate = client.date || '';
  historyEditDraft.inspectTime = client.time || '';
  historyEditDraft.comment = rec.comment || '';
  historyEditDraft.discountPercent = rec.discountPercent ?? 0;
  historyEditDraft.recordRepairTimeHours =
    rec.recordRepairTimeHours != null && rec.recordRepairTimeHours !== '' && Number.isFinite(Number(rec.recordRepairTimeHours))
      ? Number(rec.recordRepairTimeHours)
      : null;
  historyEditDraft.editManualPrice = rec.isPriceManuallyAdjusted ? (rec.manualAdjustedPrice ?? null) : null;
  historyEditDraft.attachments = (rec.attachments || []).map((a) => ({ ...a, dentIndex: a.dentIndex ?? 0 }));
  const p = rec.prepayment;
  historyEditDraft.prepayment = (p && typeof p === 'object')
    ? { amount: Number(p.amount) || 0, method: ['cash', 'transfer', 'card'].includes(p.method) ? p.method : null }
    : { amount: 0, method: null };
  try {
    historyEditDraft.editLineItems = JSON.parse(JSON.stringify(historyLineItems.value));
    if (Array.isArray(historyEditDraft.editLineItems) && historyEditDraft.editLineItems.length > 0) {
      recalcHistoryEditLineTotals(historyEditDraft.editLineItems);
    }
  } catch (_e) {
    historyEditDraft.editLineItems = null;
  }
  isEditingHistory.value = true;
}

function cancelHistoryEdit() {
  isEditingHistory.value = false;
  historyEditDraft.editLineItems = null;
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
      recordRepairTimeHours: (() => {
        const v = historyEditDraft.recordRepairTimeHours;
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? n : null;
      })(),
      attachments: historyEditDraft.attachments || [],
      dmCalculatedPrice: rec.dmCalculatedPrice ?? dmPrice,
      manualAdjustedPrice: isManual ? Number(manualVal) : null,
      isPriceManuallyAdjusted: isManual,
      lineItemsSnapshot: Array.isArray(historyEditDraft.editLineItems) ? historyEditDraft.editLineItems : rec.lineItemsSnapshot
    });
    historyEditDraft.editLineItems = null;
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
    const additionalSumDetail = (estimateDraft.additionalWorks || []).reduce((s, w) => s + (Number(w.price) || 0), 0);
    const dmDentOnlyDetail = (lineItemsSnapshot || []).reduce((s, i) => s + (Number(i.dmCalculatedLineTotal ?? i.appliedTotal) || 0), 0);
    const recordCountry = userSettings.regionCountry === 'BY' ? 'BY' : 'RU';
    const recordCurrency = recordCountry === 'BY' ? 'BYN' : 'RUB';
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
      dmCalculatedPrice: dmDentOnlyDetail + additionalSumDetail,
      discountPercent: discPct || 0,
      comment: estimateDraft.comment || '',
      attachments: estimateDraft.attachments || [],
      clientMood: estimateDraft.clientMood ?? null,
      prepayment: estimateDraft.prepayment ?? { amount: 0, method: null },
      additionalWorks: JSON.parse(JSON.stringify(estimateDraft.additionalWorks || [])),
      masterName: estimateDraft.masterName || '',
      recordRepairTimeHours: estimateDraft.repairTimeHours ?? null,
      recordCountry,
      recordCurrency,
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
  const recordCountryQuick = userSettings.regionCountry === 'BY' ? 'BY' : 'RU';
  const recordCurrencyQuick = recordCountryQuick === 'BY' ? 'BYN' : 'RUB';
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
    recordRepairTimeHours: estimateDraft.repairTimeHours ?? null,
    recordCountry: recordCountryQuick,
    recordCurrency: recordCurrencyQuick,
  };
}

async function injectDetailAnnotatedMainPhoto(payload) {
  if (!payload?.id || payload.mode !== 'detail') return;
  const annotated =
    graphicsWizardRef.value?.getDetailSession?.()?.annotatedPhotoDataUrl || null;
  if (!annotated || typeof annotated !== 'string' || !annotated.startsWith('data:')) return;
  try {
    const blob = await (await fetch(annotated)).blob();
    const key = generateAttachmentKey(payload.id, 0);
    await saveAttachment(key, blob);
    const list = [...(payload.attachments || [])];
    const ix = list.findIndex((a) => a && Number(a.dentIndex) === 0);
    if (ix >= 0) list[ix] = { ...list[ix], idbKey: key };
    else list.unshift({ dentIndex: 0, idbKey: key });
    payload.attachments = list;
  } catch (_e) {
    /* оставляем исходное вложение */
  }
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
    await injectDetailAnnotatedMainPhoto(payload);
    let saved;
    try {
      saved = await saveEstimate(payload, { allowEviction: false });
    } catch (e) {
      if (e instanceof StorageFullError) {
        console.warn('[App] Storage full, saving with eviction');
        saved = await saveEstimate(payload, { allowEviction: true });
        showToast('Хранилище заполнено — удалены старые записи', 'error', 2600);
      } else {
        throw e;
      }
    }
    onEstimateSavedForMarketPrices(saved);
    if (foundClient.value?.allRecords?.length) {
      postSaveAnalytics.value = calcPostSaveAnalytics(totalPrice.value, foundClient.value.allRecords);
    } else {
      postSaveAnalytics.value = null;
    }
    showToast('Сохранено', 'success', 1800);
    refreshBackupStorageInfo();
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

function localYmdFromDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeBookingTimeString(t) {
  if (t == null || String(t).trim() === '') return null;
  const s = String(t).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  const hh = Math.min(23, Math.max(0, h));
  const mm = Math.min(59, Math.max(0, min));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function addMinutesToTimeString(startTime, durationMinutes) {
  const [h, m] = startTime.split(':').map(Number);
  let total = h * 60 + m + durationMinutes;
  total = Math.min(total, 23 * 60 + 59);
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
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
    await injectDetailAnnotatedMainPhoto(payload);
    payload.status = 'scheduled';
    payload.bookingAt = new Date().toISOString();
    let saved;
    try {
      saved = await saveEstimate(payload, { allowEviction: false });
    } catch (e) {
      if (e instanceof StorageFullError) {
        console.warn('[App] Storage full, saving with eviction');
        saved = await saveEstimate(payload, { allowEviction: true });
        showToast('Хранилище заполнено — удалены старые записи', 'error', 2600);
      } else {
        throw e;
      }
    }
    onEstimateSavedForMarketPrices(saved);
    if (saved?.id && !bookingsStore.getByEstimateId(saved.id)) {
      const client = payload.client || {};
      const today = localYmdFromDate();
      const dateRaw = client.date != null ? String(client.date).trim() : '';
      const date =
        dateRaw.length >= 10 ? dateRaw.slice(0, 10) : today;
      const startTime =
        normalizeBookingTimeString(client.time) ||
        `${String(new Date().getHours()).padStart(2, '0')}:00`;
      const hoursRaw = Number(payload.recordRepairTimeHours);
      const hours =
        Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : 1;
      const durationMinutes = Math.max(30, Math.ceil(hours * 60));
      const endTime = addMinutesToTimeString(startTime, durationMinutes);
      const prep = Number(payload.prepayment?.amount) || 0;
      const total = Number(payload.total) || 0;
      bookingsStore.addBooking({
        date,
        startTime,
        endTime,
        durationMinutes,
        masterName: payload.masterName || undefined,
        client: {
          name: client.name,
          phone: client.phone,
          brand: client.brand,
          model: client.model,
          plate: client.plate,
        },
        serviceName: 'Удаление вмятин без покраски',
        status: 'scheduled',
        estimateId: saved.id,
        estimateTotal: total,
        payment: { total, paid: prep },
        comment: payload.comment,
      });
    }
    if (foundClient.value?.allRecords?.length) {
      postSaveAnalytics.value = calcPostSaveAnalytics(totalPrice.value, foundClient.value.allRecords);
    } else {
      postSaveAnalytics.value = null;
    }
    showToast('Записан на ремонт', 'success', 1800);
    refreshBackupStorageInfo();
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

async function generateQaHistoryRecords() {
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
    await saveEstimate(draft, { allowEviction: true });
  }
  loadHistory(true);
}

function deleteHistoryConfirm(id) {
  if (!id) return;
  if (confirm('Удалить оценку из истории?')) {
    void deleteEstimate(id).then(() => refreshBackupStorageInfo());
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
  if (isEditingHistory.value) return;
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

function openAppDrawer() {
  drawerOpen.value = true;
}

function handleDrawerNavigate(section) {
  if (section === 'notifications') {
    notificationsPreviousSection.value = currentSection.value;
    currentSection.value = 'notifications';
    return;
  }
  if (section === 'settings') {
    switchSection('settings-hub');
    return;
  }
  if (section === 'profile') {
    sectionBeforeProfile.value = currentSection.value;
    switchSection('profile');
    return;
  }
  if (section === 'tariffs') {
    switchSection('plans');
    return;
  }
  if (section === 'aggregator') {
    drawerOpen.value = false;
    switchSection('aggregator');
    return;
  }
  switchSection(section);
}

function closeProfileScreen() {
  currentSection.value = sectionBeforeProfile.value || 'home';
}

function closeSyncSettings() {
  currentSection.value = syncSettingsReturnSection.value || 'settings-hub';
}

function openSyncSettings() {
  if (!syncStore.isConfigured) return;
  syncSettingsReturnSection.value = currentSection.value;
  currentSection.value = 'sync-settings';
}

function closeSettingsHub() {
  currentSection.value = 'home';
}

function closeMarketPricesSettings() {
  currentSection.value = 'settings-hub';
}

function closeHubPlaceholder() {
  hubPlaceholderMessage.value = '';
  currentSection.value = hubPlaceholderReturnSection.value || 'settings-hub';
}

function closeAggregatorFeed() {
  currentSection.value = 'home';
}

function openSettingsHub() {
  switchSection('settings-hub');
}

function closeEmployeesList() {
  currentSection.value = 'settings-hub';
}

function openEmployeeCard(id) {
  employeeViewId.value = id;
  currentSection.value = 'employee-card';
}

function openEmployeeCreate() {
  employeeViewId.value = null;
  currentSection.value = 'employee-create';
}

function closeEmployeeCard() {
  currentSection.value = 'employees';
}

function onEmployeeSaved(id) {
  employeeViewId.value = id;
  currentSection.value = 'employee-card';
}

function openJournal() {
  drawerOpen.value = false;
  journalBookingId.value = null;
  journalCreateParams.value = null;
  currentSection.value = 'journal';
}

function closeJournal() {
  journalBookingId.value = null;
  journalCreateParams.value = null;
  currentSection.value = 'home';
}

function openJournalBooking(id) {
  journalBookingId.value = id;
  currentSection.value = 'booking-detail';
}

function openJournalCreate(date, time, masterId) {
  journalCreateParams.value = { date, time, masterId };
  currentSection.value = 'booking-create';
}

function onJournalCreateSaved(id) {
  journalBookingId.value = id;
  journalCreateParams.value = null;
  currentSection.value = 'booking-detail';
}

function onBookingDetailBack() {
  journalBookingId.value = null;
  currentSection.value = 'journal';
}

function onCreateBookingBack() {
  journalCreateParams.value = null;
  currentSection.value = 'journal';
}

function openEstimateFromJournal(id) {
  selectedHistoryId.value = id;
  currentSection.value = 'history';
}

function handleServiceDataBack() {
  currentSection.value = 'settings-hub';
}

function handleOpenOrderDocument(doc) {
  currentOrderDoc.value = doc;
  orderDocPreviousSection.value = currentSection.value;
  currentSection.value = 'order-document';
}

function closeOrderDocument() {
  const back = orderDocPreviousSection.value || 'home';
  orderDocPreviousSection.value = null;
  currentOrderDoc.value = null;
  currentSection.value = back;
}

function handleDocumentSigned(signatureBase64) {
  const cur = currentOrderDoc.value;
  if (!cur) return;
  currentOrderDoc.value = {
    ...cur,
    clientSignatureBase64: signatureBase64,
    signedAt: new Date().toISOString(),
  };
}

function openQuickOrderDocument() {
  const doc = buildOrderDocument({
    serviceData: serviceDataStore.data,
    record: {
      ...quickShareableRecord.value,
      id: estimateDraft.id,
      discountPercent: estimateDraft.discountPercent,
      additionalWorks: estimateDraft.additionalWorks,
      prepayment: estimateDraft.prepayment,
    },
  });
  handleOpenOrderDocument(doc);
}

function openNotificationsCenter() {
  notificationsPreviousSection.value = currentSection.value;
  currentSection.value = 'notifications';
}

function closeNotificationsCenter() {
  currentSection.value = notificationsPreviousSection.value || 'home';
  notificationsPreviousSection.value = null;
}

function closeNotificationsSettings() {
  currentSection.value = 'settings-hub';
}

function onNotificationOpenBooking(id) {
  journalBookingId.value = id;
  notificationsPreviousSection.value = null;
  currentSection.value = 'booking-detail';
}

async function initNotificationsRuntime() {
  await checkAndFireDueNotifications();
  rescheduleAllActiveBookings(bookingsStore.bookings);
  const tick = async () => {
    await checkAndFireDueNotifications();
    tryFireDailyDigest(bookingsStore.bookings, loadNotificationSettings());
  };
  await tick();
  if (notifPollIntervalId) clearInterval(notifPollIntervalId);
  notifPollIntervalId = setInterval(tick, 60_000);
}

function handleSettingsNavigate(section) {
  if (section === 'client-portal') {
    hubPlaceholderTitle.value = 'Портал для клиентов';
    hubPlaceholderMessage.value =
      'Создавайте ссылки на оценку с экрана результата (кнопка «Ссылка») или из карточки записи, если к ней привязан расчёт. Клиент откроет страницу без входа в приложение.';
    hubPlaceholderReturnSection.value = 'settings-hub';
    currentSection.value = 'hub-placeholder';
    return;
  }
  if (section === 'market-prices') {
    if (!requireFeature('marketPrices')) return;
    currentSection.value = 'market-prices';
    void marketPricesStore.fetchForCurrentCity();
    return;
  }
  if (section === 'sync-settings' || section === 'security') {
    syncSettingsReturnSection.value = currentSection.value;
    currentSection.value = 'sync-settings';
    return;
  }
  if (section === 'analytics') {
    currentSection.value = 'analytics';
    return;
  }
  if (section === 'notifications' || section === 'alerts') {
    currentSection.value = 'notifications-settings';
    return;
  }
  if (section === 'service-data') {
    currentSection.value = 'service-data';
    return;
  }
  if (section === 'employees') {
    currentSection.value = 'employees';
    return;
  }
  if (section === 'profile') {
    sectionBeforeProfile.value =
      currentSection.value === 'settings-hub' ? 'settings-hub' : currentSection.value;
    currentSection.value = 'profile';
    return;
  }
  if (section === 'tariffs') {
    switchSection('plans');
    return;
  }
  if (section === 'onboarding') {
    switchSection('onboarding');
    return;
  }
  if (section === 'privacy') {
    hubPlaceholderTitle.value = 'Политика конфиденциальности';
    hubPlaceholderMessage.value = '';
    hubPlaceholderReturnSection.value =
      currentSection.value === 'profile' ? 'profile' : 'settings-hub';
    currentSection.value = 'hub-placeholder';
    return;
  }
  if (section === 'system') {
    currentSection.value = 'settings';
    openSettingsSection('interface');
    return;
  }
  const settingsIds = ['pricing', 'armature', 'client', 'required', 'history', 'data-backup', 'masters'];
  if (settingsIds.includes(section)) {
    currentSection.value = 'settings';
    openSettingsSection(section);
    return;
  }
  const ph = HUB_PLACEHOLDER_TITLES[section];
  if (ph) {
    hubPlaceholderTitle.value = ph;
    hubPlaceholderMessage.value = '';
    hubPlaceholderReturnSection.value = 'settings-hub';
    currentSection.value = 'hub-placeholder';
    return;
  }
  hubPlaceholderTitle.value = String(section);
  hubPlaceholderMessage.value = '';
  hubPlaceholderReturnSection.value = 'settings-hub';
  currentSection.value = 'hub-placeholder';
}

const switchSection = (section) => {
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
const armatureSettingsGroups = getArmatureSettingsGroups();
const newArmatureWorkName = ref('');
const newArmatureWorkPrice = ref(0);
const newArmatureWorkBodyElement = ref('other');
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
  userSettings.customArmatureWorks.push({
    id: `custom_${Date.now()}`,
    name,
    price,
    bodyElement: newArmatureWorkBodyElement.value || 'other'
  });
  newArmatureWorkName.value = '';
  newArmatureWorkPrice.value = 0;
  newArmatureWorkBodyElement.value = 'other';
}
function removeCustomArmatureWork(idx) {
  userSettings.customArmatureWorks?.splice(idx, 1);
}

function getPersistableSettingsSnapshot() {
  const validated = validateSettings({ ...userSettings });
  return {
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
    armaturePriceOverrides: userSettings.armaturePriceOverrides || {},
    regionCountry: userSettings.regionCountry === 'BY' ? 'BY' : 'RU',
  };
}

function persistUserSettingsSilently() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(getPersistableSettingsSnapshot()));
}

function bumpMarketConsentSaveCounterAndMaybePrompt() {
  if (!isSupabaseConfigured()) return;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('dm_market_prices_consent')) return;
  const n = (parseInt(localStorage.getItem(SAVE_COUNT_KEY) || '0', 10) || 0) + 1;
  localStorage.setItem(SAVE_COUNT_KEY, String(n));
  if (n >= 3) showMarketConsentDialog.value = true;
}

function onEstimateSavedForMarketPrices(savedRecord) {
  if (!savedRecord) return;
  marketPricesStore.contributeRecord(savedRecord);
  void marketPricesStore.flush();
  bumpMarketConsentSaveCounterAndMaybePrompt();
}

function handleMarketConsentAccept() {
  marketPricesStore.grantConsent();
  showMarketConsentDialog.value = false;
  void marketPricesStore.fetchForCurrentCity();
}

function handleMarketConsentDecline() {
  marketPricesStore.revokeConsent();
  showMarketConsentDialog.value = false;
}

function handleApplyMarketPricesFromMarket() {
  const list = marketPricesStore.benchmarks;
  if (!list.length) {
    showToast('Нет данных для применения', 'error', 2000);
    return;
  }
  const medAvg = list.reduce((s, b) => s + b.medianPrice, 0) / list.length;
  const vals = Object.values(userSettings.prices)
    .map((n) => Number(n))
    .filter((n) => n > 0);
  if (!vals.length) return;
  const curAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (curAvg <= 0) return;
  const factor = medAvg / curAvg;
  if (!Number.isFinite(factor) || factor <= 0) return;
  for (const k of Object.keys(userSettings.prices)) {
    const v = Number(userSettings.prices[k]) || 0;
    if (v <= 0) continue;
    const next = Math.round((v * factor) / 100) * 100;
    userSettings.prices[k] = Math.min(500000, Math.max(500, next));
  }
  persistUserSettingsSilently();
  showToast('Базовые цены обновлены по рынку', 'success', 2000);
  haptic('success');
}

const saveSettings = () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(getPersistableSettingsSnapshot()));
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
    userSettings.regionCountry = 'RU';
    userSettings.discountSamePartEnabled = false;
    userSettings.discountSamePartValue = 50;
    userSettings.discountDiffPartEnabled = false;
    userSettings.discountDiffPartValue = 0;
    saveSettings();
  }
};

async function openClientField(field, label, inputType, placeholder) {
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const phoneReg = userSettings.regionCountry === 'BY' ? 'BY' : 'RU';
  let fieldVal = estimateDraft[field] ?? '';
  if (field === 'clientPhone') fieldVal = normalizePhoneForInput(fieldVal, phoneReg);
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: fieldVal,
    inputType,
    placeholder,
    mask,
    phoneRegion: mask === 'phone' ? phoneReg : undefined
  });
  if (value !== undefined && value !== null) {
    estimateDraft[field] = typeof value === 'string' ? value : String(value);
  }
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
  const rec = selectedHistory.value;
  const phoneReg =
    rec && (rec.recordCountry === 'BY' || rec.recordCurrency === 'BYN') ? 'BY' : 'RU';
  let fieldVal = historyEditDraft[field] ?? '';
  if (field === 'clientPhone') fieldVal = normalizePhoneForInput(fieldVal, phoneReg);
  const value = await openInputModal({
    title: 'Редактирование',
    label,
    value: fieldVal,
    inputType,
    placeholder: label,
    mask,
    phoneRegion: mask === 'phone' ? phoneReg : undefined
  });
  if (value !== undefined && value !== null) {
    historyEditDraft[field] = typeof value === 'string' ? value : String(value);
  }
}

/** Строка клиента в истории: открываем полноценное редактирование, затем нужное поле. */
async function onHistoryClientInfoEditField(field) {
  const map = {
    name: ['clientName', 'Имя', 'text'],
    phone: ['clientPhone', 'Тел', 'tel'],
    car: ['carBrand', 'Марка', 'text'],
    company: ['clientCompany', 'Компания', 'text'],
  };
  const spec = map[field];
  if (!spec) return;
  startHistoryEdit();
  await nextTick();
  await openHistoryEditField(spec[0], spec[1], spec[2]);
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
  historyEditDraft.clientCompany = client.company || client.clientCompany || '';
  historyEditDraft.clientPhone = client.phone || client.clientPhone || '';
  historyEditDraft.carBrand = client.brand || client.carBrand || '';
  historyEditDraft.carModel = client.model || client.carModel || '';
  historyEditDraft.carPlate = client.plate || client.carPlate || '';
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
  window.addEventListener('online', onAppOnline);
  window.addEventListener('offline', onAppOffline);
  updateFooterHeight();
  footerResizeObserver = new ResizeObserver(() => updateFooterHeight());
  if (bottomNavRef.value) footerResizeObserver.observe(bottomNavRef.value);
  window.addEventListener('resize', updateFooterHeight);
  ensureInspectDateTime();
  cleanupImportBackups();
  refreshBackupStorageInfo();
  try {
    const { useRegisterSW } = await import('virtual:pwa-register/vue');
    const sw = useRegisterSW({
      onRegistered(r) {
        if (import.meta.env?.DEV) console.info('[DentMetric] SW registered:', r);
      },
      onRegisterError(error) {
        console.warn('[DentMetric] SW registration error:', error);
      },
    });
    watch(
      sw.needRefresh,
      (v) => {
        pwaNeedRefresh.value = !!v;
      },
      { immediate: true }
    );
    pwaUpdateSW.value = sw.updateServiceWorker;
  } catch (_e) {
    /* PWA optional without plugin / dev */
  }
  loadHistory();
  const snapshot = [...(historyItems.value || [])];
  const { records: migratedRecords, result: migrationResult } = await migrateLegacyPhotosToIdb(snapshot);
  if (migrationResult.migrated > 0) {
    console.info(
      `[DentMetric] Migrated ${migrationResult.migrated} photos to IDB. Skipped: ${migrationResult.skipped}. Failed: ${migrationResult.failed}.`
    );
    historyPinia.safeSaveHistory(migratedRecords, { allowEviction: true });
    loadHistory(true);
    refreshBackupStorageInfo();
  }
  void initNotificationsRuntime();
  void marketPricesStore.flush();
  if (marketPricesStore.consentGranted) {
    void marketPricesStore.fetchForCurrentCity();
  }
  marketPricesPollId = setInterval(() => {
    if (!marketPricesStore.consentGranted || !navigator.onLine) return;
    void marketPricesStore.fetchForCurrentCity();
    void marketPricesStore.flush();
  }, 15 * 60 * 1000);
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
  window.removeEventListener('online', onAppOnline);
  window.removeEventListener('offline', onAppOffline);
  window.removeEventListener('resize', updateFooterHeight);
  if (footerResizeObserver && bottomNavRef.value) footerResizeObserver.unobserve(bottomNavRef.value);
  if (footerResizeObserver) footerResizeObserver.disconnect();
  if (notifPollIntervalId) {
    clearInterval(notifPollIntervalId);
    notifPollIntervalId = null;
  }
  if (marketPricesPollId) {
    clearInterval(marketPricesPollId);
    marketPricesPollId = null;
  }
});
</script>

<style scoped>
.offline-banner {
  background: var(--dm-surface-2, hsl(0 0% 12%));
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  flex-shrink: 0;
}
.sw-update-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-accent, #a0e040);
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  white-space: nowrap;
  font-size: 13px;
  color: var(--dm-text-primary, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
.sw-update-toast__btn {
  background: var(--dm-accent, #a0e040);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 12px;
  min-height: 32px;
}
.dm-settings-row--storage-bar {
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.storage-bar-wrap {
  flex: 1;
  min-width: 80px;
  height: 6px;
  background: var(--dm-border, #2a2a2a);
  border-radius: 3px;
  overflow: hidden;
}
.storage-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.storage-bar-label {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  white-space: nowrap;
  flex-shrink: 0;
  width: 100%;
  text-align: right;
}
@media (min-width: 360px) {
  .dm-settings-row--storage-bar .storage-bar-label {
    width: auto;
  }
}
.settings-import-result {
  padding: 8px 0;
  font-size: 12px;
}
.settings-import-result--error {
  color: var(--dm-danger, #e53935);
}
.settings-import-result--ok {
  color: var(--dm-accent, #a0e040);
}
.dm-settings-row__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
}
.top-leading-cluster {
  display: flex;
  align-items: center;
  gap: 4px;
}
.notif-bell-btn {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.notif-bell-icon {
  font-size: 20px;
  line-height: 1;
}
.notif-bell-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  background: var(--dm-danger);
  color: hsl(0 0% 100%);
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
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
/* Один скролл на .history-detail-content: вкладки не схлопывают панель (flex-1 + min-h-0 давали пустую зону). */
.history-detail-wrapper :deep(.history-final-tabs.rf-tabs) {
  flex: 0 1 auto;
  min-height: 0;
}
.history-detail-wrapper :deep(.history-final-tabs .rf-tabs__panels) {
  flex: 0 1 auto;
  min-height: auto;
  overflow: visible;
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
.bottom-nav-ico {
  display: block;
  flex-shrink: 0;
}
.bottom-nav-ico--brand {
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bottom-nav-btn--active {
  color: var(--dm-accent, #a0e040);
  background: color-mix(in srgb, var(--dm-accent, #a0e040) 12%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--dm-accent, #a0e040) 18%, transparent);
}
.bottom-nav-btn--idle {
  color: var(--dm-text-secondary, #888888);
}
.bottom-nav-btn--idle:hover {
  color: color-mix(in srgb, var(--dm-text-secondary, #888888) 85%, #fff);
}
.bottom-nav-btn:focus-visible {
  outline: 2px solid rgba(136, 229, 35, 0.5);
  outline-offset: 2px;
}

.autocopy-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  line-height: 1.3;
  background: var(--dm-surface-2);
  border: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  max-width: 100%;
}
.autocopy-pill__dismiss {
  min-height: 44px;
  padding: 0 8px;
  margin: -6px -10px -6px 0;
  border: none;
  background: transparent;
  color: var(--dm-accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.apply-all-btn {
  padding: 6px 12px;
  min-height: 44px;
  max-width: 100%;
  background: transparent;
  border: 1px solid var(--dm-border);
  border-radius: 10px;
  color: var(--dm-text-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  text-align: center;
}
.apply-all-btn--applied {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
}
</style>
