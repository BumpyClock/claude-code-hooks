/**
 * Token usage integration module
 * Integrates ccusage functionality into the monitoring dashboard
 */

import path from 'path';
import { 
  getClaudePaths, 
  loadDailyUsageData, 
  loadMonthlyUsageData,
  loadSessionData,
  loadSessionBlockData
} from '../../../ccusage/src/data-loader';
import { LiveMonitor } from '../../../ccusage/src/_live-monitor';
import type { CostMode, SortOrder } from '../../../ccusage/src/_types';
import { 
  calculateBurnRate, 
  projectBlockUsage 
} from '../../../ccusage/src/_session-blocks';
import { getTotalTokens } from '../../../ccusage/src/_token-utils';

// Re-export types for use in other server modules
export type { LoadedUsageEntry, SessionBlock } from '../../../ccusage/src/_session-blocks';

// Configuration
const DEFAULT_SESSION_DURATION_HOURS = 5;
const DEFAULT_COST_MODE: CostMode = 'auto';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

// Live monitor instance (singleton)
let liveMonitor: LiveMonitor | null = null;

/**
 * Initialize the live monitor
 */
function initLiveMonitor() {
  if (!liveMonitor) {
    try {
      const claudePaths = getClaudePaths();
      liveMonitor = new LiveMonitor({
        claudePaths,
        sessionDurationHours: DEFAULT_SESSION_DURATION_HOURS,
        mode: DEFAULT_COST_MODE,
        order: DEFAULT_SORT_ORDER
      });
    } catch (error) {
      console.error('Failed to initialize live monitor:', error);
    }
  }
  return liveMonitor;
}

/**
 * Get daily usage data
 */
export async function getDailyUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  breakdown?: boolean;
  mode?: CostMode;
}) {
  try {
    const claudePaths = getClaudePaths();
    const data = await loadDailyUsageData({
      claudePaths,
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      breakdown: options?.breakdown || false
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading daily usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load daily usage data' 
    };
  }
}

/**
 * Get monthly usage data
 */
export async function getMonthlyUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  breakdown?: boolean;
  mode?: CostMode;
}) {
  try {
    const claudePaths = getClaudePaths();
    const data = await loadMonthlyUsageData({
      claudePaths,
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      breakdown: options?.breakdown || false
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading monthly usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load monthly usage data' 
    };
  }
}

/**
 * Get session usage data
 */
export async function getSessionUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  mode?: CostMode;
  order?: SortOrder;
}) {
  try {
    const claudePaths = getClaudePaths();
    const data = await loadSessionData({
      claudePaths,
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      order: options?.order || DEFAULT_SORT_ORDER
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading session usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load session usage data' 
    };
  }
}

/**
 * Get billing blocks usage data
 */
export async function getBlocksUsage(options?: {
  active?: boolean;
  recent?: boolean;
  mode?: CostMode;
  order?: SortOrder;
  tokenLimit?: number | 'max';
}) {
  try {
    const claudePaths = getClaudePaths();
    let blocks = await loadSessionBlockData({
      claudePaths,
      sessionDurationHours: DEFAULT_SESSION_DURATION_HOURS,
      mode: options?.mode || DEFAULT_COST_MODE,
      order: options?.order || DEFAULT_SORT_ORDER,
      tokenLimit: options?.tokenLimit
    });

    // Apply filters (same logic as CLI's blocks command)
    if (options?.recent) {
      // Filter recent blocks (would need to import filterRecentBlocks from ccusage)
      // For now, skip this filter
    }

    if (options?.active) {
      blocks = blocks.filter(block => block.isActive);
    }

    // Add computed fields (same as CLI's JSON output)
    const enrichedBlocks = blocks.map(block => {
      const burnRate = block.isActive ? calculateBurnRate(block) : null;
      const projection = block.isActive ? projectBlockUsage(block) : null;

      return {
        id: block.id,
        startTime: block.startTime.toISOString(),
        endTime: block.endTime.toISOString(),
        actualEndTime: block.actualEndTime?.toISOString(),
        isActive: block.isActive,
        isGap: block.isGap,
        entries: block.entries,
        tokenCounts: block.tokenCounts,
        totalTokens: getTotalTokens(block.tokenCounts),
        costUSD: block.costUSD,
        models: block.models,
        burnRate,
        projection
      };
    });

    return { success: true, data: enrichedBlocks };
  } catch (error) {
    console.error('Error loading blocks usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load blocks usage data' 
    };
  }
}

/**
 * Get live monitoring data for the active block with full aggregation
 */
export async function getLiveBlockData() {
  try {
    // Use the same approach as the CLI's blocks command for consistency
    const result = await getBlocksUsage({
      active: true,
      mode: DEFAULT_COST_MODE,
      order: DEFAULT_SORT_ORDER
    });
    
    if (!result.success) {
      return result;
    }
    
    // Return the first (and only) active block
    const blocks = result.data;
    const activeBlock = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;
    
    if (!activeBlock) {
      return { 
        success: true, 
        data: null,
        message: 'No active session block' 
      };
    }
    
    return { success: true, data: activeBlock };
  } catch (error) {
    console.error('Error getting live block data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get live monitoring data' 
    };
  }
}

/**
 * Clean up resources
 */
export function cleanup() {
  if (liveMonitor) {
    liveMonitor[Symbol.dispose]();
    liveMonitor = null;
  }
}