# PHASE 0 — APPLICATION MAP (DentMetric)

## Routes / Screens

| Section | Entry | File(s) | Notes |
|--------|-------|---------|-------|
| **Home** | `currentSection === 'home'` | App.vue | WowScreenShell + tiles (Метрика, Аналитика, История, Журнал) |
| **Metric (mode selection)** | `currentSection === 'metric' && !calcMode` | App.vue | WowScreenShell — Быстрый / Детализация / Град |
| **Quick mode** | `calcMode === 'standard'` | App.vue L116–627 | Step 1 (client) → Step 2 (dents) → Step 3 (result). No router. |
| **Detail mode (Graphics)** | `calcMode === 'graphics'` | GraphicsWizard.vue | Photo-based: Client(opt)→Photo→Placement→Per-dent→Final |
| **History list** | `currentSection === 'history' && !selectedHistory` | HistoryScreen.vue | Filter tabs, cards, search |
| **History detail** | `currentSection === 'history' && selectedHistory` | App.vue L679–826 | Overlay with sticky actions |
| **Settings** | `currentSection === 'settings'` | App.vue L830–1205 | Accordion sections |
| **Info** | `currentSection === 'info'` | App.vue | Overflow-y-auto content |

## Active Flows

### Quick
Entry: Home → Метрика → Быстрый  
Steps: Client (opt) → Dents (QuickStyleStep2 inline) → Result (QuickStyleFinalSection inline)  
Result: QuickStyleFinalSection in App.vue  
Save: `saveCurrentEstimate('quick')` → history

### Detail (photo-based)
Entry: Home → Метрика → Детализация  
Steps:
1. Client (opt) — QuickStyleClientSection
2. Photo — StepPhotoSelect
3. Placement — Step1PlacementPanel (Konva canvas)
4. Per-dent — QuickStyleStep2Section (repeated per dent)
5. Final — QuickStyleFinalSection

### History
List (HistoryScreen) → click card → Detail overlay (App.vue) → Назад → list (v-show preserves filter)

### Settings
Accordion sections: pricing, armature, interface, client, required, history, masters  
`settingsOpenSection = ref(null)` — all closed by default ✓

---

## Shared Components

| Component | File | Used In |
|-----------|------|---------|
| QuickStyleClientSection | quickStyle/QuickStyleClientSection.vue | App.vue (Quick), GraphicsWizard (Detail step 1) |
| QuickStyleStep2Section | quickStyle/QuickStyleStep2Section.vue | App.vue (Quick step 2), GraphicsWizard (Detail step 4) |
| QuickStyleConditionsSection | quickStyle/QuickStyleConditionsSection.vue | GraphicsWizard (non-photo step 4) |
| QuickStyleFinalSection | quickStyle/QuickStyleFinalSection.vue | App.vue (Quick step 3), GraphicsWizard (Detail step 5) |
| StepPhotoSelect | graphics/StepPhotoSelect.vue | GraphicsWizard |
| Step1PlacementPanel | graphics/Step1PlacementPanel.vue | GraphicsWizard |
| Step2SizePanel | graphics/Step2SizePanel.vue | GraphicsWizard (non-photo) |
| StepHeader | graphics/StepHeader.vue | GraphicsWizard |
| WowScreenShell | WowScreenShell.vue | Home, Metric mode selection |
| HistoryScreen | HistoryScreen.vue | App.vue (history section) |

---

## State / Store / Composables

| Name | File | Manages |
|------|------|---------|
| useHistoryStore | historyStore.ts | historyItems, loadHistory, saveEstimate, updateEstimate, deleteEstimate |
| useClientSearch | useClientSearch.ts | foundClient, searchByPhone, searchByName (from history) |
| useFeatureGate | planFeatures | requireFeature, paywallVisible |
| estimateDraft | App.vue | Reactive draft for Quick/Detail |
| userSettings | App.vue | Pricing, UI toggles, clientRequired, etc. |

---

## Design Tokens (CSS Variables)

| Token | Value | Usage |
|-------|-------|-------|
| --metric-green | #88E523 | Accent, CTAs |
| --metric-bg-card | #151515 | Cards |
| --metric-bg-mid | #1a1a1a | Mid surfaces |
| --screen-padding-x | 1rem (16px) | Horizontal padding |
| --qc-section-gap | 6px | Gap between Quick sections |
| --qc-card-px, --qc-card-py | 10px, 8px | Card padding |
| --dm-detail-font-* | 10–13px | Detail typography |
| --safe-top, --safe-bottom | env(safe-area-inset-*) | Safe area |

---

## Quick Mode — PROTECTED FILES (DO NOT TOUCH)

- `src/App.vue` — Quick flow inline (L116–627)
- `src/components/quickStyle/QuickStyleClientSection.vue`
- `src/components/quickStyle/QuickStyleStep2Section.vue`
- `src/components/quickStyle/QuickStyleConditionsSection.vue`
- `src/components/quickStyle/QuickStyleFinalSection.vue`

---

## Existing Test Setup

- **Playwright**: `playwright.config.js` in dentmetric root
- **testDir**: `./e2e`
- **baseURL**: http://localhost:5173
- **Projects**: chromium, Mobile Chrome (Pixel 5)
- **E2E specs**: standard-flow, detail-flow, history-flow, settings-toggles, freeform, consistency, detail-summary-scroll, mobile, qa-overlay
- **No** Telegram WebApp mock
- **No** shared fixtures.ts
- **data-testid**: Many already present (btn-open-metric, metric-standard, metric-graphics, quick-step2, etc.)
