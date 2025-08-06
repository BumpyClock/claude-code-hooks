export interface GroupingPreferences {
  enabled: boolean;
  timeWindow: number; // milliseconds
  minEventsToGroup: number;
  groupByTool: boolean;
  groupBySession: boolean;
  groupByEventType: boolean;
  maxGroupSize: number;
}

export interface GroupingCriteria {
  sessionId: string;
  sourceApp: string;
  eventType: string;
  toolName?: string;
}

export interface EventGroup {
  id: string;
  criteria: GroupingCriteria;
  events: HookEvent[];
  startTime: number;
  endTime: number;
  lastUpdated: number;
  count: number;
  summary?: string;
  chips: string[];
}

export interface GroupedEvent extends HookEvent {
  isGroup: true;
  groupMeta: GroupMeta;
}

export interface GroupMeta {
  group: 'aggregate';
  count: number;
  timeRange: [number, number];
  key: string;
  tool?: string;
  chips: string[];
  children: HookEvent[];
  summary?: string;
}

export interface SwimlanePreferences {
  enabled: boolean;
  showEmptyLanes: boolean;
  laneOrder: string[]; // source_app order
  pinnedLanes: string[];
  collapsedLanes: string[];
}

export interface ProjectLane {
  sourceApp: string;
  events: (HookEvent | GroupedEvent)[];
  lastActivity: number;
  eventCount: number;
  isPinned: boolean;
  isCollapsed: boolean;
}

import type { HookEvent } from '../types';