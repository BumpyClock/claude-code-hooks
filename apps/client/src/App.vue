<template>
  <div class="h-screen flex flex-col bg-[var(--theme-bg-secondary)] relative overflow-hidden">
    <!-- Ambient background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)]/5 via-transparent to-[var(--theme-primary)]/3 pointer-events-none"></div>
    
    <header class="relative bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--theme-border-primary)]/40 shadow-lg z-50">
      <div class="px-4 py-3 mobile:py-2 mobile:flex-col mobile:space-y-2 flex items-center justify-between">
        <!-- Title Section -->
        <div class="mobile:w-full mobile:text-center flex items-center gap-3">
          <!-- Logo -->
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary-dark)] flex items-center justify-center shadow-md">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 class="text-xl mobile:text-base font-bold bg-gradient-to-r from-[var(--theme-text-primary)] to-[var(--theme-text-secondary)] bg-clip-text text-transparent">
            Multi-Agent Observability
          </h1>
        </div>
        
        <!-- Connection Status -->
        <div class="mobile:w-full mobile:justify-center flex items-center gap-2">
          <div v-if="isConnected" class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animation-delay-500"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></span>
            </span>
            <span class="text-sm mobile:text-xs text-[var(--theme-text-secondary)] font-medium">Connected</span>
          </div>
          <div v-else class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span class="text-sm mobile:text-xs text-[var(--theme-text-secondary)] font-medium">Disconnected</span>
          </div>
        </div>
        
        <!-- Event Count and Theme Toggle -->
        <div class="mobile:w-full mobile:justify-center flex items-center gap-2">
          <span class="text-sm mobile:text-xs text-[var(--theme-text-secondary)] font-medium bg-gradient-to-r from-[var(--theme-bg-tertiary)] to-[var(--theme-bg-quaternary)] px-2.5 py-1 rounded-lg border border-[var(--theme-border-primary)]/30 shadow-sm backdrop-blur-sm">
            <span class="font-bold text-[var(--theme-primary)]">{{ events.length }}</span> events
          </span>
          
          <!-- Filters Toggle Button -->
          <button
            @click="showFilters = !showFilters"
            class="p-2 mobile:p-1.5 rounded-lg bg-[var(--theme-bg-tertiary)]/80 hover:bg-[var(--theme-bg-quaternary)] hover:scale-105 transition-all duration-200 border border-[var(--theme-border-primary)]/30 shadow-sm hover:shadow-md backdrop-blur-sm"
            :title="showFilters ? 'Hide filters' : 'Show filters'"
          >
            <span class="text-base mobile:text-sm">Filters</span>
          </button>
          
          <!-- Theme Switcher -->
          <div class="relative">
            <button
              @click="showThemeMenu = !showThemeMenu"
              class="p-2 mobile:p-1.5 rounded-lg bg-[var(--theme-bg-tertiary)]/80 hover:bg-[var(--theme-bg-quaternary)] hover:scale-105 transition-all duration-200 border border-[var(--theme-border-primary)]/30 shadow-sm hover:shadow-md backdrop-blur-sm flex items-center gap-1.5"
              :title="themes.autoThemeEnabled.value ? 'Auto theme enabled' : `Current theme: ${themes.state.value.currentTheme}`"
            >
              <span class="text-base mobile:text-sm">
                {{ themes.autoThemeEnabled.value ? '🌓 Auto' : themes.state.value.currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light' }}
              </span>
            </button>
            
            <!-- Theme Dropdown Menu -->
            <div
              v-if="showThemeMenu"
              class="absolute right-0 mt-2 w-48 rounded-lg bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)] shadow-xl overflow-hidden backdrop-blur-xl"
              style="z-index: 9999"
            >
              <!-- Auto Theme Toggle -->
              <button
                @click="toggleAutoTheme(); showThemeMenu = false"
                class="w-full px-4 py-2 text-left hover:bg-[var(--theme-bg-tertiary)] transition-colors flex items-center justify-between"
              >
                <span class="text-sm">🌓 Auto Theme</span>
                <div class="w-3 h-3 rounded-full" :class="themes.autoThemeEnabled.value ? 'bg-green-500' : 'bg-gray-400'"></div>
              </button>
              
              <div class="border-t border-[var(--theme-border-primary)]"></div>
              
              <!-- Manual Theme Options -->
              <div :class="themes.autoThemeEnabled.value ? 'opacity-50 pointer-events-none' : ''">
                <button
                  @click="themes.setTheme('light'); showThemeMenu = false"
                  class="w-full px-4 py-2 text-left hover:bg-[var(--theme-bg-tertiary)] transition-colors flex items-center justify-between"
                  :class="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'light' ? 'bg-[var(--theme-bg-tertiary)]' : ''"
                >
                  <span class="text-sm">☀️ Light</span>
                  <span v-if="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'light'" class="text-xs">✓</span>
                </button>
                
                <button
                  @click="themes.setTheme('dark'); showThemeMenu = false"
                  class="w-full px-4 py-2 text-left hover:bg-[var(--theme-bg-tertiary)] transition-colors flex items-center justify-between"
                  :class="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'dark' ? 'bg-[var(--theme-bg-tertiary)]' : ''"
                >
                  <span class="text-sm">🌙 Dark</span>
                  <span v-if="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'dark'" class="text-xs">✓</span>
                </button>
                
                <button
                  @click="themes.setTheme('modern'); showThemeMenu = false"
                  class="w-full px-4 py-2 text-left hover:bg-[var(--theme-bg-tertiary)] transition-colors flex items-center justify-between"
                  :class="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'modern' ? 'bg-[var(--theme-bg-tertiary)]' : ''"
                >
                  <span class="text-sm">💎 Modern</span>
                  <span v-if="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'modern'" class="text-xs">✓</span>
                </button>
                
                <button
                  @click="themes.setTheme('ocean'); showThemeMenu = false"
                  class="w-full px-4 py-2 text-left hover:bg-[var(--theme-bg-tertiary)] transition-colors flex items-center justify-between"
                  :class="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'ocean' ? 'bg-[var(--theme-bg-tertiary)]' : ''"
                >
                  <span class="text-sm">🌊 Ocean</span>
                  <span v-if="!themes.autoThemeEnabled.value && themes.state.value.currentTheme === 'ocean'" class="text-xs">✓</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Project Filter Cards -->
    <div class="relative z-[5]">
      <ProjectFilterCards :events="events" :filters="filters as any" v-model:selectedProject="selectedProject" />
    </div>

    <!-- Filters -->
    <FilterPanel
      v-if="showFilters"
      :filters="filters as any"
      @update:filters="filters = $event"
    />
    
    <!-- Live Pulse Chart -->
    <div class="relative z-10">
      <LivePulseChart
        :events="events"
        :filters="filters as any"
      />
    </div>
    
    <!-- Timeline -->
    <EventTimeline
      :events="events"
      :filters="filters as any"
      :selected-project="selectedProject"
      v-model:stick-to-bottom="stickToBottom"
      class="relative z-10"
    />
    
    <!-- Stick to bottom button -->
    <StickScrollButton
      :stick-to-bottom="stickToBottom"
      @toggle="stickToBottom = !stickToBottom"
    />
    
    <!-- Error message -->
    <div
      v-if="error"
      class="fixed bottom-4 left-4 mobile:bottom-3 mobile:left-3 mobile:right-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-700 px-3 py-2 mobile:px-2 mobile:py-1.5 rounded-lg mobile:text-xs shadow-lg backdrop-blur-sm flex items-center gap-2"
    >
      <AlertCircle class="w-4 h-4 text-red-500" />
      <span>{{ error }}</span>
    </div>
    
    <!-- Theme Manager -->
    <ThemeManager 
      :is-open="showThemeManager"
      @close="showThemeManager = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import EventTimeline from './components/EventTimeline.vue';
import FilterPanel from './components/FilterPanel.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import LivePulseChart from './components/LivePulseChart.vue';
import ThemeManager from './components/ThemeManager.vue';
import ProjectFilterCards from './components/ProjectFilterCards.vue';

// WebSocket connection
const { events, isConnected, error } = useWebSocket('ws://localhost:4000/stream');

// Theme management
const themes = useThemes();

// Filters
const filters = ref({
  sessionId: '',
  eventType: ''
});

// UI state
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showFilters = ref(false);
const showThemeMenu = ref(false);
const selectedProject = ref<string>('');

// Computed properties

// Toggle auto theme
const toggleAutoTheme = () => {
  if (themes.autoThemeEnabled.value) {
    themes.disableAutoTheme();
  } else {
    themes.enableAutoTheme();
  }
};

// Handle click outside to close theme menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showThemeMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>