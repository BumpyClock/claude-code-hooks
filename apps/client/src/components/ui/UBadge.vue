<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'solid' | 'outline' | 'soft'
  color?: 'primary' | 'gray' | 'red' | 'green' | 'blue'
  size?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  color: 'primary',
  size: 'sm'
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center rounded-full font-medium transition-colors'
  
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-sm',
    md: 'px-2.5 py-1 text-sm'
  }
  
  const variants = {
    solid: {
      primary: 'bg-[var(--theme-primary)] text-white',
      gray: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]',
      red: 'bg-red-500 text-white',
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white'
    },
    outline: {
      primary: 'border border-[var(--theme-border-primary)] text-[var(--theme-text-primary)] bg-[var(--theme-bg-primary)]',
      gray: 'border border-[var(--theme-border-secondary)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-secondary)]',
      red: 'border border-red-500 text-red-500 bg-white',
      green: 'border border-green-500 text-green-500 bg-white',
      blue: 'border border-blue-500 text-blue-500 bg-white'
    },
    soft: {
      primary: 'bg-[var(--theme-primary-light)] text-[var(--theme-primary)]',
      gray: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600'
    }
  }
  
  return [
    base,
    sizes[props.size],
    variants[props.variant][props.color]
  ].filter(Boolean).join(' ')
})
</script>