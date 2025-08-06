<template>
  <div class="space-y-4">
    <!-- Grouping Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-[var(--theme-text-primary)]">Event Grouping</h3>
        <p class="text-xs text-[var(--theme-text-tertiary)]">Automatically group similar events together</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="toggleGrouping"
        :class="[
          'transition-all duration-200',
          groupingPreferences.enabled
            ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
            : 'hover:bg-[var(--theme-bg-tertiary)]'
        ]"
      >
        {{ groupingPreferences.enabled ? 'ON' : 'OFF' }}
      </Button>
    </div>

    <!-- Grouping Settings (when enabled) -->
    <div v-if="groupingPreferences.enabled" class="space-y-4 pt-2">
      <!-- Time Window -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label class="text-xs font-medium text-[var(--theme-text-secondary)]">
            Time Window
          </Label>
          <span class="text-xs font-mono text-[var(--theme-text-tertiary)]">
            {{ timeWindowSeconds }}s
          </span>
        </div>
        <div class="space-y-2">
          <Slider
            :model-value="[groupingPreferences.timeWindow]"
            @update:model-value="updateTimeWindow"
            :min="2000"
            :max="15000"
            :step="1000"
            class="w-full"
          />
          <div class="flex justify-between text-[10px] text-[var(--theme-text-quaternary)]">
            <span>2s</span>
            <span>15s</span>
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="space-y-2">
        <Label class="text-xs font-medium text-[var(--theme-text-secondary)]">
          Quick Presets
        </Label>
        <div class="grid grid-cols-3 gap-1">
          <Button
            v-for="preset in presets"
            :key="preset.name"
            variant="outline"
            size="sm"
            class="text-xs py-1"
            @click="applyPreset(preset.key)"
            :class="[
              isActivePreset(preset.key) && 'bg-primary/10 border-primary/40 text-primary'
            ]"
          >
            {{ preset.name }}
          </Button>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <Label class="text-xs font-medium text-[var(--theme-text-secondary)]">
            Advanced
          </Label>
          <Button
            variant="ghost"
            size="sm"
            @click="showAdvanced = !showAdvanced"
            class="h-auto p-1"
          >
            <ChevronDown 
              :class="[
                'h-3 w-3 transition-transform',
                showAdvanced && 'rotate-180'
              ]"
            />
          </Button>
        </div>

        <div v-if="showAdvanced" class="space-y-3 pl-2 border-l-2 border-[var(--theme-border-primary)]/20">
          <!-- Min Events to Group -->
          <div class="flex items-center justify-between">
            <Label class="text-xs text-[var(--theme-text-tertiary)]">
              Min events to group
            </Label>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="decrementMinEvents"
                :disabled="groupingPreferences.minEventsToGroup <= 2"
                class="h-6 w-6 p-0"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <span class="text-xs font-mono w-8 text-center">
                {{ groupingPreferences.minEventsToGroup }}
              </span>
              <Button
                variant="outline"
                size="sm"
                @click="incrementMinEvents"
                :disabled="groupingPreferences.minEventsToGroup >= 10"
                class="h-6 w-6 p-0"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Max Group Size -->
          <div class="flex items-center justify-between">
            <Label class="text-xs text-[var(--theme-text-tertiary)]">
              Max group size
            </Label>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="decrementMaxSize"
                :disabled="groupingPreferences.maxGroupSize <= 5"
                class="h-6 w-6 p-0"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <span class="text-xs font-mono w-8 text-center">
                {{ groupingPreferences.maxGroupSize }}
              </span>
              <Button
                variant="outline"
                size="sm"
                @click="incrementMaxSize"
                :disabled="groupingPreferences.maxGroupSize >= 100"
                class="h-6 w-6 p-0"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Grouping Criteria -->
          <div class="space-y-2">
            <Label class="text-xs text-[var(--theme-text-tertiary)]">
              Group by
            </Label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupByTool"
                  class="rounded border-[var(--theme-border-primary)]"
                />
                <span class="text-[var(--theme-text-tertiary)]">Tool</span>
              </label>
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupBySession"
                  class="rounded border-[var(--theme-border-primary)]"
                />
                <span class="text-[var(--theme-text-tertiary)]">Session</span>
              </label>
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupByEventType"
                  class="rounded border-[var(--theme-border-primary)]"
                />
                <span class="text-[var(--theme-text-tertiary)]">Event Type</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Swimlane Settings -->
    <div class="border-t border-[var(--theme-border-primary)]/20 pt-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-[var(--theme-text-primary)]">Swimlane View</h3>
          <p class="text-xs text-[var(--theme-text-tertiary)]">Show events in separate lanes by project</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="toggleSwimlanes"
          :class="[
            'transition-all duration-200',
            swimlanePreferences.enabled
              ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
              : 'hover:bg-[var(--theme-bg-tertiary)]'
          ]"
        >
          {{ swimlanePreferences.enabled ? 'ON' : 'OFF' }}
        </Button>
      </div>

      <div v-if="swimlanePreferences.enabled" class="mt-3 space-y-2">
        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            v-model="swimlanePreferences.showEmptyLanes"
            class="rounded border-[var(--theme-border-primary)]"
          />
          <span class="text-[var(--theme-text-tertiary)]">Show empty lanes</span>
        </label>
      </div>
    </div>

    <!-- Stats Display -->
    <div v-if="groupingStats" class="border-t border-[var(--theme-border-primary)]/20 pt-4">
      <div class="space-y-2">
        <Label class="text-xs font-medium text-[var(--theme-text-secondary)]">
          Grouping Stats
        </Label>
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-[var(--theme-text-tertiary)]">Reduction:</span>
            <span class="font-mono ml-1 text-[var(--theme-text-primary)]">
              {{ groupingStats.reductionPercentage }}%
            </span>
          </div>
          <div>
            <span class="text-[var(--theme-text-tertiary)]">Groups:</span>
            <span class="font-mono ml-1 text-[var(--theme-text-primary)]">
              {{ groupingStats.groupedCount }}
            </span>
          </div>
          <div>
            <span class="text-[var(--theme-text-tertiary)]">Avg size:</span>
            <span class="font-mono ml-1 text-[var(--theme-text-primary)]">
              {{ groupingStats.averageGroupSize }}
            </span>
          </div>
          <div>
            <span class="text-[var(--theme-text-tertiary)]">Total:</span>
            <span class="font-mono ml-1 text-[var(--theme-text-primary)]">
              {{ groupingStats.processedEvents }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Button -->
    <div class="border-t border-[var(--theme-border-primary)]/20 pt-4">
      <Button
        variant="outline"
        size="sm"
        @click="resetToDefaults"
        class="w-full text-xs"
      >
        Reset to Defaults
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronDown, Plus, Minus } from 'lucide-vue-next'
import { useGroupingPreferences } from '../composables/useGroupingPreferences'

interface GroupingStats {
  totalEvents: number
  processedEvents: number
  groupedCount: number
  individualCount: number
  reductionPercentage: number
  averageGroupSize: number
}

const props = defineProps<{
  groupingStats?: GroupingStats
}>()

const {
  groupingPreferences,
  swimlanePreferences,
  setGroupingEnabled,
  setTimeWindow,
  setSwimlaneEnabled,
  applyPreset: applyPresetFn,
  resetToDefaults: resetToDefaultsFn
} = useGroupingPreferences()

const showAdvanced = ref(false)

const presets = [
  { name: 'Minimal', key: 'minimal' as const },
  { name: 'Normal', key: 'normal' as const },
  { name: 'Aggressive', key: 'aggressive' as const }
]

const timeWindowSeconds = computed(() => {
  return Math.round(groupingPreferences.value.timeWindow / 1000)
})

const toggleGrouping = () => {
  setGroupingEnabled(!groupingPreferences.value.enabled)
}

const toggleSwimlanes = () => {
  setSwimlaneEnabled(!swimlanePreferences.value.enabled)
}

const updateTimeWindow = (value: number[]) => {
  setTimeWindow(value[0])
}

const applyPreset = (preset: 'minimal' | 'normal' | 'aggressive') => {
  applyPresetFn(preset)
}

const isActivePreset = (preset: 'minimal' | 'normal' | 'aggressive'): boolean => {
  const prefs = groupingPreferences.value
  switch (preset) {
    case 'minimal':
      return prefs.timeWindow === 5000 && prefs.minEventsToGroup === 3 && prefs.maxGroupSize === 10
    case 'normal':
      return prefs.timeWindow === 10000 && prefs.minEventsToGroup === 2 && prefs.maxGroupSize === 20
    case 'aggressive':
      return prefs.timeWindow === 15000 && prefs.minEventsToGroup === 2 && prefs.maxGroupSize === 50
    default:
      return false
  }
}

const incrementMinEvents = () => {
  if (groupingPreferences.value.minEventsToGroup < 10) {
    groupingPreferences.value.minEventsToGroup++
  }
}

const decrementMinEvents = () => {
  if (groupingPreferences.value.minEventsToGroup > 2) {
    groupingPreferences.value.minEventsToGroup--
  }
}

const incrementMaxSize = () => {
  if (groupingPreferences.value.maxGroupSize < 100) {
    groupingPreferences.value.maxGroupSize += 5
  }
}

const decrementMaxSize = () => {
  if (groupingPreferences.value.maxGroupSize > 5) {
    groupingPreferences.value.maxGroupSize -= 5
  }
}

const resetToDefaults = () => {
  resetToDefaultsFn()
}

// Slider component (simple implementation)
const Slider = {
  props: ['modelValue', 'min', 'max', 'step'],
  emits: ['update:modelValue'],
  template: `
    <input
      type="range"
      :value="modelValue[0]"
      :min="min"
      :max="max"
      :step="step"
      @input="$emit('update:modelValue', [$event.target.value])"
      class="w-full h-2 bg-[var(--theme-bg-tertiary)] rounded-lg appearance-none cursor-pointer slider"
    />
  `
}
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--theme-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 4px var(--theme-primary, #3b82f6) with 20% opacity;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--theme-primary);
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
}
</style>