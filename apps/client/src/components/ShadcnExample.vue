<script setup lang="ts">
import { Button, Badge, Card } from '@/components/ui'
</script>

<template>
  <div class="p-6 space-y-4">
    <h2 class="text-2xl font-bold text-foreground">shadcn-vue Integration Test</h2>
    
    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-muted-foreground">Button Variants:</h3>
      <div class="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-muted-foreground">Button Sizes:</h3>
      <div class="flex flex-wrap gap-2 items-center">
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">🚀</Button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-muted-foreground">Badge Variants:</h3>
      <div class="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="soft">Soft (Custom)</Badge>
        <Badge variant="solid">Solid (Custom)</Badge>
      </div>
    </div>

    <Card class="mt-6 p-4">
      <p class="text-card-foreground">
        🎉 <strong>Migration Complete!</strong> All nuxt-ui components have been successfully 
        replaced with shadcn-vue equivalents. Your app now has:
      </p>
      <ul class="mt-2 ml-4 list-disc text-sm text-muted-foreground space-y-1">
        <li>Accessible components built on Radix Vue</li>
        <li>Consistent design system with your existing theme</li>
        <li>TypeScript support with proper type inference</li>
        <li>Custom variants (soft, solid) for backward compatibility</li>
        <li>Tree-shakeable imports for optimal bundle size</li>
      </ul>
    </Card>
  </div>
</template>