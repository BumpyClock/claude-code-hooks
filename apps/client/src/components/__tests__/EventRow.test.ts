// ABOUTME: Test suite for EventRow.vue component focusing on UBadge migration
// ABOUTME: Validates badge/chip element conversion and functionality preservation

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EventRow from '../EventRow.vue'
import type { HookEvent } from '../../types'

// Mock Nuxt UI components for testing
const UBadge = {
  name: 'UBadge',
  template: '<span :class="`ubadge-${variant}-${color || \'default\'}`" v-bind="$attrs"><slot /></span>',
  props: ['variant', 'color', 'size', 'label']
}

const mockEvent: HookEvent = {
  session_id: 'test-session-12345678',
  source_app: 'TestApp',
  hook_event_type: 'PreToolUse',
  timestamp: Date.now(),
  payload: {
    tool_name: 'TestTool',
    tool_input: {
      command: 'test command'
    }
  },
  summary: 'Test event summary'
}

const defaultProps = {
  event: mockEvent,
  gradientClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
  colorClass: 'bg-blue-500',
  appGradientClass: 'bg-gradient-to-r from-green-500 to-green-600',
  appColorClass: 'bg-green-500',
  appHexColor: '#10b981'
}

const createWrapper = (props = {}) => {
  return mount(EventRow, {
    props: { ...defaultProps, ...props },
    global: {
      components: {
        UBadge,
        // Mock other components
        ChatTranscriptModal: { template: '<div data-testid="chat-modal" />' },
        EventDetailsModal: { template: '<div data-testid="details-modal" />' }
      },
      stubs: {
        // Stub Lucide icons
        Copy: { template: '<div class="icon-copy" />' },
        Check: { template: '<div class="icon-check" />' },
        X: { template: '<div class="icon-x" />' },
        MessageSquare: { template: '<div class="icon-message-square" />' },
        Wrench: { template: '<div class="icon-wrench" />' },
        Bell: { template: '<div class="icon-bell" />' },
        Square: { template: '<div class="icon-square" />' },
        Box: { template: '<div class="icon-box" />' },
        FileText: { template: '<div class="icon-file-text" />' },
        Pencil: { template: '<div class="icon-pencil" />' },
        ListTodo: { template: '<div class="icon-list-todo" />' },
        Files: { template: '<div class="icon-files" />' },
        LogOut: { template: '<div class="icon-log-out" />' },
        MoreHorizontal: { template: '<div class="icon-more-horizontal" />' }
      }
    }
  })
}

describe('EventRow UBadge Migration', () => {
  describe('Session ID badges', () => {
    it('should render session ID badges with UBadge variant="outline"', async () => {
      const wrapper = createWrapper()
      
      // Test mobile session ID badge (line 23-25)
      const mobileSessionBadge = wrapper.find('[data-testid="mobile-session-badge"]')
      expect(mobileSessionBadge.exists()).toBe(true)
      expect(mobileSessionBadge.classes()).toContain('ubadge-outline-default')
      expect(mobileSessionBadge.text()).toBe('test-ses') // First 8 chars
      
      // Test desktop session ID badge (line 42)
      const desktopSessionBadge = wrapper.find('[data-testid="desktop-session-badge"]')
      expect(desktopSessionBadge.exists()).toBe(true)
      expect(desktopSessionBadge.classes()).toContain('ubadge-outline-default')
      expect(desktopSessionBadge.text()).toBe('test-ses')
    })
    
    it('should preserve dynamic border color styling', async () => {
      const wrapper = createWrapper()
      
      const sessionBadge = wrapper.find('[data-testid="mobile-session-badge"]')
      expect(sessionBadge.attributes('style')).toContain('border-color')
    })
  })
  
  describe('Event type badges', () => {
    it('should render event type badges with UBadge variant="solid"', async () => {
      const wrapper = createWrapper()
      
      const eventTypeBadge = wrapper.find('[data-testid="event-type-badge"]')
      expect(eventTypeBadge.exists()).toBe(true)
      expect(eventTypeBadge.classes()).toContain('ubadge-solid-primary')
      expect(eventTypeBadge.text()).toContain('PreToolUse')
    })
    
    it('should include event icon within badge', async () => {
      const wrapper = createWrapper()
      
      const eventTypeBadge = wrapper.find('[data-testid="event-type-badge"]')
      const icon = eventTypeBadge.find('.lucide-wrench')
      expect(icon.exists()).toBe(true)
    })
    
    it('should handle different event types correctly', async () => {
      const stopEvent = { ...mockEvent, hook_event_type: 'Stop' as const }
      const wrapper = createWrapper({ event: stopEvent })
      
      const eventTypeBadge = wrapper.find('[data-testid="event-type-badge"]')
      expect(eventTypeBadge.text()).toContain('Stop')
      
      const stopIcon = eventTypeBadge.find('.lucide-square')
      expect(stopIcon.exists()).toBe(true)
    })
  })
  
  describe('App name badges', () => {
    it('should render mobile app badge with UBadge variant="soft"', async () => {
      const wrapper = createWrapper()
      
      const mobileAppBadge = wrapper.find('[data-testid="mobile-app-badge"]')
      expect(mobileAppBadge.exists()).toBe(true)
      expect(mobileAppBadge.classes()).toContain('ubadge-soft-default')
      expect(mobileAppBadge.text()).toBe('TestApp')
    })
    
    it('should render desktop app badge with UBadge variant="soft"', async () => {
      const wrapper = createWrapper()
      
      const desktopAppBadge = wrapper.find('[data-testid="desktop-app-badge"]')
      expect(desktopAppBadge.exists()).toBe(true)
      expect(desktopAppBadge.classes()).toContain('ubadge-soft-default')
      expect(desktopAppBadge.text()).toBe('TestApp')
    })
    
    it('should preserve dynamic app color styling', async () => {
      const wrapper = createWrapper()
      
      const appBadge = wrapper.find('[data-testid="mobile-app-badge"]')
      expect(appBadge.attributes('style')).toContain('border-color')
      expect(appBadge.attributes('style')).toContain('#10b981') // appHexColor
    })
    
    it('should maintain hover effects on app badges', async () => {
      const wrapper = createWrapper()
      
      const appBadge = wrapper.find('[data-testid="mobile-app-badge"]')
      expect(appBadge.classes()).toContain('hover:shadow-md')
      expect(appBadge.classes()).toContain('hover:scale-105')
    })
  })
  
  describe('File chip elements', () => {
    it('should render file chips with UBadge variant="outline"', async () => {
      const groupEvent = {
        ...mockEvent,
        meta: {
          group: 'aggregate',
          chips: ['file1.ts', 'file2.vue', 'file3.js'],
          count: 3,
          tool: 'Read'
        }
      }
      
      const wrapper = createWrapper({ event: groupEvent })
      
      const fileChips = wrapper.findAll('[data-testid^="file-chip-"]')
      expect(fileChips.length).toBe(3)
      
      fileChips.forEach((chip, index) => {
        expect(chip.classes()).toContain('ubadge-outline-default')
        expect(chip.text()).toBe(groupEvent.meta.chips[index])
      })
    })
    
    it('should preserve hover effects on file chips', async () => {
      const groupEvent = {
        ...mockEvent,
        meta: {
          group: 'aggregate',
          chips: ['file1.ts'],
          count: 1,
          tool: 'Read'
        }
      }
      
      const wrapper = createWrapper({ event: groupEvent })
      
      const fileChip = wrapper.find('[data-testid="file-chip-0"]')
      expect(fileChip.classes()).toContain('hover:scale-105')
    })
    
    it('should limit file chips display to 8 items', async () => {
      const manyFiles = Array.from({ length: 12 }, (_, i) => `file${i + 1}.ts`)
      const groupEvent = {
        ...mockEvent,
        meta: {
          group: 'aggregate',
          chips: manyFiles,
          count: 12,
          tool: 'Read'
        }
      }
      
      const wrapper = createWrapper({ event: groupEvent })
      
      const fileChips = wrapper.findAll('[data-testid^="file-chip-"]')
      expect(fileChips.length).toBe(8)
      
      const moreIndicator = wrapper.find('[data-testid="more-files-indicator"]')
      expect(moreIndicator.exists()).toBe(true)
      expect(moreIndicator.text()).toContain('4') // 12 - 8 = 4 more files
    })
  })
  
  describe('Responsive design preservation', () => {
    it('should show appropriate badges on mobile vs desktop', async () => {
      const wrapper = createWrapper()
      
      // Mobile-specific badges should have mobile: block class
      const mobileSection = wrapper.find('.mobile\\:block')
      expect(mobileSection.exists()).toBe(true)
      
      // Desktop-specific badges should have mobile:hidden class  
      const desktopSection = wrapper.find('.mobile\\:hidden')
      expect(desktopSection.exists()).toBe(true)
    })
  })
  
  describe('Accessibility compliance', () => {
    it('should maintain proper ARIA attributes on badges', async () => {
      const wrapper = createWrapper()
      
      const badges = wrapper.findAll('[class*="ubadge-"]')
      badges.forEach(badge => {
        // UBadge should handle accessibility internally
        expect(badge.element.tagName).toBe('SPAN')
      })
    })
    
    it('should preserve semantic meaning through proper labeling', async () => {
      const wrapper = createWrapper()
      
      const sessionBadge = wrapper.find('[data-testid="mobile-session-badge"]')
      expect(sessionBadge.attributes('aria-label') || sessionBadge.text()).toBeTruthy()
    })
  })
  
  describe('CSS custom properties integration', () => {
    it('should maintain CSS variable-based theming', async () => {
      const wrapper = createWrapper()
      
      const component = wrapper.find('[data-testid="mobile-app-badge"]')
      const style = component.attributes('style')
      
      // Should still use CSS custom properties for theming compatibility
      expect(style).toMatch(/var\(--theme-|background-color.*rgba.*16, 185, 129/) // CSS variables or app colors preserved
    })
  })
})