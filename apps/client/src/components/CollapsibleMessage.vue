<template>
  <div 
    class="p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="messageClass"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start space-x-3 flex-1">
        <!-- Badge/Label -->
        <span 
          class="text-sm font-bold px-3 py-1.5 rounded-lg flex-shrink-0 shadow-md"
          :class="badgeClass"
        >
          <component :is="icon" class="h-4 w-4 inline mr-1" />
          {{ label }}
        </span>
        
        <!-- Content Area -->
        <div class="flex-1">
          <!-- Main Content -->
          <div class="text-base text-[var(--theme-text-primary)] font-medium">
            <!-- String content -->
            <template v-if="typeof content === 'string'">
              <p v-if="!needsTruncation || isExpanded" class="whitespace-pre-wrap break-words">
                {{ processedContent }}
              </p>
              <div v-else>
                <p class="whitespace-pre-wrap break-words">{{ typeof truncatedContent === 'string' ? truncatedContent : truncatedContent.text }}</p>
                <UButton
                  @click.stop="toggleContentExpansion"
                  variant="ghost"
                  size="xs"
                  class="mt-1 text-xs"
                >
                  Show more
                </UButton>
              </div>
            </template>
            
            <!-- Complex content (array) -->
            <div v-else-if="Array.isArray(content)" class="space-y-2">
              <slot name="complex-content" :content="content" :expanded="isExpanded">
                <!-- Default complex content rendering -->
                <div v-for="(item, idx) in (isExpanded ? content : content.slice(0, 2))" :key="idx">
                  <slot name="content-item" :item="item" :index="idx">
                    <p v-if="item.type === 'text'" class="whitespace-pre-wrap break-words">
                      {{ item.text }}
                    </p>
                    <div v-else class="bg-[var(--theme-bg-tertiary)]/50 p-3 rounded-lg border border-[var(--theme-border-primary)]/30">
                      <pre class="text-sm text-[var(--theme-text-secondary)] font-mono whitespace-pre">{{ JSON.stringify(item, null, 2) }}</pre>
                    </div>
                  </slot>
                </div>
                <UButton
                  v-if="content.length > 2 && !isExpanded"
                  @click.stop="toggleContentExpansion"
                  variant="ghost"
                  size="xs"
                  class="text-xs"
                >
                  Show {{ content.length - 2 }} more items
                </UButton>
              </slot>
            </div>
          </div>
          
          <!-- Metadata -->
          <slot name="metadata">
            <div v-if="timestamp" class="mt-2 text-xs text-[var(--theme-text-tertiary)]">
              <Clock class="h-3 w-3 inline mr-1" />
              {{ formattedTimestamp }}
            </div>
          </slot>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center space-x-1 ml-2">
        <!-- Show/Hide Content Button (only if content is truncatable) -->
        <UButton
          v-if="needsTruncation"
          @click.stop="toggleContentExpansion"
          variant="soft"
          size="xs"
          class="flex items-center gap-1"
        >
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="h-3 w-3" />
          {{ isExpanded ? 'Less' : 'More' }}
        </UButton>
        
        <!-- Show Details Button -->
        <UButton
          @click.stop="toggleDetailsExpansion"
          variant="soft"
          size="xs"
          class="flex items-center gap-1"
        >
          <component :is="showDetails ? ChevronUp : ChevronDown" class="h-3 w-3" />
          {{ showDetails ? 'Hide' : 'Details' }}
        </UButton>
        
        <!-- Copy Button -->
        <UButton
          @click.stop="handleCopy"
          variant="soft"
          size="xs"
          square
          :title="'Copy message'"
        >
          <component :is="copyIcon" class="h-3.5 w-3.5" :class="copyIconClass" />
        </UButton>
      </div>
    </div>
    
    <!-- Details Section -->
    <Transition name="expand">
      <div v-if="showDetails" class="mt-3 p-3 bg-[var(--theme-bg-tertiary)]/30 rounded-lg border border-[var(--theme-border-primary)]/20 overflow-hidden">
        <div class="overflow-x-auto max-w-full">
          <pre class="text-xs text-[var(--theme-text-secondary)] font-mono whitespace-pre">{{ JSON.stringify(rawMessage, null, 2) }}</pre>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.expand-enter-from {
  opacity: 0;
  transform: scaleY(0.9) translateY(-10px);
}

.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-10px);
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronDown, ChevronUp, Copy, Check, X, Clock } from 'lucide-vue-next';
import { useMessageActions } from '../composables/useMessageActions';
import { MAX_TRUNCATE_LENGTH, DEFAULT_TRUNCATE_LINES } from '../utils';

interface Props {
  id: string;
  type: 'user' | 'assistant' | 'system';
  label: string;
  icon: any;
  content: string | any[];
  rawMessage: any;
  timestamp?: string | number;
  messageClass?: string;
  badgeClass?: string;
  maxLines?: number;
  maxCharacters?: number;
}

const props = defineProps<Props>();

const {
  isContentExpanded,
  isDetailsExpanded,
  toggleContent,
  toggleDetails,
  truncateContent,
  copyMessage,
  getCopyState,
  cleanSystemContent,
  cleanCommandContent,
  formatTimestamp,
  needsTruncation: checkNeedsTruncation
} = useMessageActions({
  maxLines: props.maxLines || DEFAULT_TRUNCATE_LINES,
  maxCharacters: props.maxCharacters || MAX_TRUNCATE_LENGTH
});

// Computed properties
const isExpanded = computed(() => isContentExpanded(props.id));
const showDetails = computed(() => isDetailsExpanded(props.id));

const processedContent = computed(() => {
  if (typeof props.content !== 'string') return props.content;
  
  let processed = props.content;
  
  // Clean system messages
  if (props.type === 'system') {
    processed = cleanSystemContent(processed);
  }
  
  // Clean command messages
  if (processed.includes('<command-')) {
    processed = cleanCommandContent(processed);
  }
  
  return processed;
});

const needsTruncation = computed(() => {
  if (typeof props.content !== 'string') {
    return Array.isArray(props.content) && props.content.length > 2;
  }
  return checkNeedsTruncation(processedContent.value as string);
});

const truncatedContent = computed(() => {
  if (typeof props.content !== 'string') return { text: '', isTruncated: false };
  return truncateContent(processedContent.value as string, isExpanded.value);
});

const formattedTimestamp = computed(() => {
  return props.timestamp ? formatTimestamp(props.timestamp) : '';
});

const copyState = computed(() => getCopyState(props.id));
const copyIcon = computed(() => {
  if (copyState.value === 'success') return Check;
  if (copyState.value === 'error') return X;
  return Copy;
});

const copyIconClass = computed(() => {
  if (copyState.value === 'success') return 'text-green-500';
  if (copyState.value === 'error') return 'text-red-500';
  return '';
});

// Methods
const toggleContentExpansion = () => toggleContent(props.id);
const toggleDetailsExpansion = () => toggleDetails(props.id);
const handleCopy = () => copyMessage(props.id, props.rawMessage);
</script>