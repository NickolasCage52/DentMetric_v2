<template>
  <div class="app-wow-background" aria-hidden="true">
    <div class="wow-bg__layer wow-bg__base" />
    <div class="wow-bg__layer wow-bg__band" />
    <div class="wow-bg__layer wow-bg__fog" />
    <div class="wow-bg__layer wow-bg__grain" />
  </div>
</template>

<script setup>
defineOptions({ name: 'AppWowBackground' });
</script>

<style scoped>
.app-wow-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.wow-bg__layer {
  position: absolute;
  inset: 0;
}

/* Layer 1: deep black + radial vignette (edges darker) */
.wow-bg__base {
  background: #050505;
  background: radial-gradient(
    ellipse 100% 100% at 50% 45%,
    transparent 0%,
    transparent 35%,
    rgba(0, 0, 0, 0.4) 65%,
    rgba(0, 0, 0, 0.85) 100%
  );
}

/* Layer 2: green energy band horizontal, centered, soft bloom above/below */
.wow-bg__band {
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 28%,
    rgba(var(--wow-green-rgb, 136, 229, 35), 0.04) 38%,
    rgba(var(--wow-green-rgb, 136, 229, 35), var(--wow-glow-soft, 0.08)) 45%,
    rgba(var(--wow-green-rgb, 136, 229, 35), var(--wow-glow-intensity, 0.14)) 50%,
    rgba(var(--wow-green-rgb, 136, 229, 35), var(--wow-glow-soft, 0.08)) 55%,
    rgba(var(--wow-green-rgb, 136, 229, 35), 0.04) 62%,
    transparent 72%,
    transparent 100%
  );
  animation: wow-band-drift 16s ease-in-out infinite;
}

@keyframes wow-band-drift {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.88; }
}
@media (prefers-reduced-motion: reduce) {
  .wow-bg__band { animation: none; }
}

/* Layer 2b: pulsing fog behind tiles (centered, behind content) */
.wow-bg__fog {
  background: radial-gradient(
    ellipse 90% 70% at 50% 52%,
    rgba(136, 229, 35, 0.06) 0%,
    rgba(136, 229, 35, 0.02) 40%,
    transparent 70%
  );
  filter: blur(24px);
  animation: wow-fog-pulse 10s ease-in-out infinite;
}

@keyframes wow-fog-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  .wow-bg__fog { animation: none; }
}

/* Layer 3: very subtle film grain (lightweight SVG noise) */
.wow-bg__grain {
  opacity: 0.028;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 128px 128px;
}
</style>
