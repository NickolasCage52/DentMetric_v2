# PHASE 1 — UX AUDIT

## 1.1 Detail Mode Audit

| Screen | Issues found |
|--------|--------------|
| **Photo entry (StepPhotoSelect)** | Uses `quick-style-photo`, `flex flex-col min-h-0 flex-1 overflow-hidden`. Footer/action bar pattern needs verification for fixed-bar overlap. |
| **Placement (Step1PlacementPanel)** | `quick-style-placement`, `flex flex-col min-h-0 flex-1 overflow-hidden`. Same layout pattern. |
| **Client vs Quick** | Uses QuickStyleClientSection — match ✓ |
| **Per-dent input (step 4)** | Uses QuickStyleStep2Section inside `detail-step4-wrap`. Content has `padding-bottom: calc(72px + env(safe-area-inset-bottom) + 16px)` — scroll should not overlap footer. Action bar: `graphics-action-bar shrink-0`. |
| **Conditions/coefficients** | QuickStyleConditionsSection (non-photo flow). |
| **Final result** | QuickStyleFinalSection — match ✓ |
| **Legacy screens** | Step0ClientPanel: "not used in active flow" (photo-based). Non-photo flow still uses Step2SizePanel, QuickStyleConditionsSection. No legacy screens in active photo flow. |
| **Scroll issues** | Need visual verification. `detail-step4-content` has `overflow-y-auto`, `-webkit-overflow-scrolling: touch`. |
| **Fixed bar overlap** | Pattern appears correct (flex-column, footer flex-shrink: 0) but needs verification on device. |
| **Dent numbering** | konvaEditor.js: `fontSize` 24–48, `fill: #FFFFFF`, `stroke: #000000`, `strokeWidth: 2` — already readable. |

## 1.2 Settings Audit

| Item | Status |
|------|--------|
| Sections auto-open on entry | **NO** — `settingsOpenSection = ref(null)` (App.vue L1576) ✓ |
| Section order | pricing → armature → interface → client → required → history → masters |
| Label/helper text layout | `dm-settings-row__label-area` with label + description — structure exists. Verify stacked layout. |
| Controls vs History/Profile | dm-settings-row, dm-section-header used consistently. |
| Save button placement | In `settings-screen__footer` (flex-shrink: 0) — should be sticky. |
| Mobile scroll | `settings-screen__content` has `overflow-y-auto`. Layout: `settings-screen flex flex-col min-h-0 flex-1`. Need to verify footer does not overlap. |

## 1.3 History Audit

| Item | Status |
|------|--------|
| List screen | HistoryScreen — hs-card, hs-summary, filter tabs. |
| Record card | hs-card with phone, name, car, total, badge. |
| Sticky action bar | `history-detail-actions` with `history-detail-actions__inner` — `flex-shrink: 0`, `pb-[calc(0.5rem+env(safe-area-inset-bottom))]`. Wrapper: `history-detail-wrapper flex flex-col min-h-0 flex-1`. Content: `history-detail-content flex-1 min-h-0 overflow-y-auto`. Pattern correct. |
| Back navigation | `selectedHistoryId = null` on Назад. HistoryScreen uses `v-show="!selectedHistory"` — component stays mounted, so `activeRange`, `activeStatusFilter` preserved ✓ |
| Edit mode | Works — historyEditDraft, startHistoryEdit, saveHistoryEdit. |
| Attachments | AttachmentPicker, HistoryAttachmentsView used. |
| Manual price display | `isPriceManuallyAdjusted`, `dmCalculatedPrice`, `manualAdjustedPrice` displayed (App.vue L702–704) ✓ |

## 1.4 Global Layout Audit

| Category | Screens |
|----------|---------|
| Correct flex-column + inner scroll | History detail, Settings, GraphicsWizard step 4 |
| Broken page-level scroll | TBD — need visual verification |
| Fixed elements overlap | TBD — need visual verification |
| Safe area not handled | Footers use `env(safe-area-inset-bottom)` ✓ |
| Inconsistent horizontal padding | Need to scan for 12px, 8px, 20px, 24px in graphics/detail/settings |
