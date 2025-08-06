<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        soft: 'border-transparent bg-secondary/30 text-secondary-foreground hover:bg-secondary/40',
        solid: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface Props extends PrimitiveProps {
  variant?: VariantProps<typeof badgeVariants>['variant']
  class?: HTMLAttributes['class']
}

withDefaults(defineProps<Props>(), {
  as: 'div',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(badgeVariants({ variant }), $props.class)"
  >
    <slot />
  </Primitive>
</template>