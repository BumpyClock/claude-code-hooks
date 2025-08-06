<template>
  <button 
    :class="buttonClasses"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'solid' | 'outline' | 'ghost' | 'soft'
  color?: 'primary' | 'gray' | 'red' | 'green' | 'blue'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  square?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  color: 'primary',
  size: 'md',
  disabled: false,
  square: false
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const sizes = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm', 
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8'
  }
  
  const variants = {
    solid: {
      primary: 'bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]',
      gray: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-quaternary)]',
      red: 'bg-red-500 text-white hover:bg-red-600',
      green: 'bg-green-500 text-white hover:bg-green-600',
      blue: 'bg-blue-500 text-white hover:bg-blue-600'
    },
    outline: {
      primary: 'border border-[var(--theme-border-primary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]',
      gray: 'border border-[var(--theme-border-secondary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]',
      red: 'border border-red-500 text-red-500 hover:bg-red-50',
      green: 'border border-green-500 text-green-500 hover:bg-green-50',
      blue: 'border border-blue-500 text-blue-500 hover:bg-blue-50'
    },
    ghost: {
      primary: 'text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]',
      gray: 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]',
      red: 'text-red-500 hover:bg-red-50',
      green: 'text-green-500 hover:bg-green-50',
      blue: 'text-blue-500 hover:bg-blue-50'
    },
    soft: {
      primary: 'bg-[var(--theme-primary-light)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary-light)]/80',
      gray: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-quaternary)]',
      red: 'bg-red-100 text-red-600 hover:bg-red-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    }
  }
  
  const squareClass = props.square ? 'aspect-square p-0' : ''
  
  return [
    base,
    sizes[props.size],
    variants[props.variant][props.color],
    squareClass
  ].filter(Boolean).join(' ')
})
</script>