<template>
  <Teleport to="body">
    <div class="notif-stack">
      <TransitionGroup name="notif">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          :class="`notif-item--${n.type}`"
          @click="dismiss(n.id)"
        >
          <span class="notif-icon">{{ icons[n.type] }}</span>
          <div class="notif-content">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-msg" v-if="n.message">{{ n.message }}</div>
          </div>
          <button
            v-if="n.action"
            type="button"
            class="notif-action"
            @click.stop="n.action && n.action.handler()"
          >
            {{ n.action && n.action.label }}
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotifications } from '../useNotifications'

const { notifications, dismiss } = useNotifications()
const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' }
</script>

<style scoped>
.notif-stack {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: 12px;
  left: 12px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.notif-item {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  pointer-events: all;
  cursor: pointer;
  border-left: 3px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.notif-item--success {
  border-left-color: var(--metric-green);
}

.notif-item--info {
  border-left-color: #64b5f6;
}

.notif-item--warning {
  border-left-color: #f59e0b;
}

.notif-item--error {
  border-left-color: #f87171;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.notif-msg {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.notif-action {
  margin-left: auto;
  color: var(--metric-green);
  font-size: 12px;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.notif-enter-active,
.notif-leave-active {
  transition: all 0.25s ease;
}

.notif-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.notif-leave-to {
  transform: translateX(110%);
  opacity: 0;
}
</style>
