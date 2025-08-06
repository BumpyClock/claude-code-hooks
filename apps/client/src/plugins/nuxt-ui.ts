// Nuxt UI Plugin for Vue 3 + Vite
import type { App } from 'vue'
import UButton from '@nuxt/ui/dist/runtime/components/Button.vue'
import UBadge from '@nuxt/ui/dist/runtime/components/Badge.vue'

// Import Nuxt UI components
// Note: We'll import components individually as needed since we're not in a Nuxt environment
export default {
  install(app: App) {
    // Register components globally
    app.component('UButton', UButton)
    app.component('UBadge', UBadge)
    
    // Register global properties for Nuxt UI
    app.config.globalProperties.$ui = {
      strategy: 'merge',
      colors: {
        primary: 'blue',
        gray: 'cool'
      }
    }

    // Add any global Nuxt UI configuration here
    app.provide('ui', {
      strategy: 'merge',
      colors: {
        primary: 'blue',
        gray: 'cool'
      }
    })
  }
}