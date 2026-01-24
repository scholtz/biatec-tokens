<template>
  <div class="tooltip-container" @mouseenter="showTooltip" @mouseleave="hideTooltip">
    <slot></slot>
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="visible"
          ref="tooltipRef"
          :class="['tooltip-content', positionClass]"
          :style="tooltipStyle"
          role="tooltip"
        >
          <div class="tooltip-arrow" :class="arrowClass"></div>
          <div class="tooltip-text">
            <slot name="content">
              {{ content }}
            </slot>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'

interface Props {
  content?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  position: 'top',
  delay: 200,
  maxWidth: '300px'
})

const visible = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
let timeoutId: number | null = null

const positionClass = computed(() => `tooltip-${props.position}`)
const arrowClass = computed(() => `arrow-${props.position}`)

const showTooltip = (event: MouseEvent) => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  
  timeoutId = window.setTimeout(async () => {
    visible.value = true
    await nextTick()
    
    if (tooltipRef.value) {
      const trigger = event.currentTarget as HTMLElement
      const triggerRect = trigger.getBoundingClientRect()
      const tooltipRect = tooltipRef.value.getBoundingClientRect()
      
      let top = 0
      let left = 0
      
      switch (props.position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = triggerRect.bottom + 8
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.left - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.right + 8
          break
      }
      
      // Keep tooltip within viewport
      const padding = 8
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
      
      tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        maxWidth: props.maxWidth
      }
    }
  }, props.delay)
}

const hideTooltip = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  visible.value = false
}

// Cleanup on unmount
onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
})
</script>

<style scoped>
.tooltip-container {
  display: inline-block;
  position: relative;
}

.tooltip-content {
  position: fixed;
  z-index: 9999;
  padding: 8px 12px;
  background: rgba(31, 41, 55, 0.95);
  color: white;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.4;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(31, 41, 55, 0.95);
  transform: rotate(45deg);
}

.arrow-top {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
}

.arrow-bottom {
  top: -4px;
  left: 50%;
  margin-left: -4px;
}

.arrow-left {
  right: -4px;
  top: 50%;
  margin-top: -4px;
}

.arrow-right {
  left: -4px;
  top: 50%;
  margin-top: -4px;
}

.tooltip-text {
  position: relative;
  z-index: 1;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

/* Dark mode support */
:global(.dark) .tooltip-content {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(75, 85, 99, 0.3);
}

:global(.dark) .tooltip-arrow {
  background: rgba(17, 24, 39, 0.95);
}
</style>
