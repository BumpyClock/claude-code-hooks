/**
 * Style and color utility functions for consistent CSS class generation
 */

/**
 * Color utility functions for CSS class manipulation and color transformations
 */
export const colorUtils = {
  /**
   * Convert a background class (bg-*) to border class (border-*)
   * @param bgClass - Background CSS class (e.g., "bg-blue-500")
   * @returns Corresponding border class (e.g., "border-blue-500")
   */
  toBorderClass(bgClass: string): string {
    if (!bgClass) return '';
    return bgClass.replace('bg-', 'border-');
  },

  /**
   * Add opacity to a hex color
   * @param hex - Hex color string (e.g., "#3B82F6")
   * @param opacity - Opacity value between 0 and 1 (e.g., 0.2 for 20%)
   * @returns Hex color with opacity suffix (e.g., "#3B82F633")
   */
  withOpacity(hex: string, opacity: number): string {
    if (!hex || opacity < 0 || opacity > 1) return hex;
    
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert opacity to hex (0-255 -> 00-FF)
    const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    
    return `#${cleanHex}${opacityHex}`;
  },

  /**
   * Convert hex color to RGBA string
   * @param hex - Hex color string (e.g., "#3B82F6")
   * @param alpha - Alpha value between 0 and 1 (default: 1)
   * @returns RGBA color string (e.g., "rgba(59, 130, 246, 0.2)")
   */
  toRgba(hex: string, alpha: number = 1): string {
    if (!hex) return 'rgba(0, 0, 0, 0)';
    
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse hex to RGB
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get hex color value from Tailwind background class
   * @param bgClass - Background CSS class (e.g., "bg-blue-500")
   * @returns Hex color string or empty string if not found
   */
  getHexFromBgClass(bgClass: string): string {
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3B82F6',
      'bg-green-500': '#22C55E',
      'bg-yellow-500': '#EAB308',
      'bg-purple-500': '#A855F7',
      'bg-pink-500': '#EC4899',
      'bg-indigo-500': '#6366F1',
      'bg-red-500': '#EF4444',
      'bg-orange-500': '#F97316',
      'bg-teal-500': '#14B8A6',
      'bg-cyan-500': '#06B6D4',
      'bg-gray-500': '#6B7280'
    };
    
    return colorMap[bgClass] || '';
  },

  /**
   * Generate gradient classes for Tailwind backgrounds
   * @param baseColor - Base color class (e.g., "bg-blue-500")
   * @returns Gradient class string (e.g., "bg-gradient-to-r from-blue-500 to-blue-600")
   */
  toGradientClass(baseColor: string): string {
    const gradientMap: Record<string, string> = {
      'bg-blue-500': 'from-blue-500 to-blue-600',
      'bg-green-500': 'from-green-500 to-green-600',
      'bg-yellow-500': 'from-yellow-500 to-yellow-600',
      'bg-purple-500': 'from-purple-500 to-purple-600',
      'bg-pink-500': 'from-pink-500 to-pink-600',
      'bg-indigo-500': 'from-indigo-500 to-indigo-600',
      'bg-red-500': 'from-red-500 to-red-600',
      'bg-orange-500': 'from-orange-500 to-orange-600',
      'bg-teal-500': 'from-teal-500 to-teal-600',
      'bg-cyan-500': 'from-cyan-500 to-cyan-600',
    };
    
    return `bg-gradient-to-r ${gradientMap[baseColor] || 'from-gray-500 to-gray-600'}`;
  }
};

/**
 * CSS animation and transition utilities
 */
export const animationUtils = {
  /**
   * Standard transition duration for hover effects
   */
  HOVER_TRANSITION: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  /**
   * Standard transition duration for modal animations
   */
  MODAL_TRANSITION: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  /**
   * Standard transition for expand/collapse effects
   */
  EXPAND_TRANSITION: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

/**
 * Common style patterns for consistent UI components
 */
export const stylePatterns = {
  /**
   * Standard glass effect background
   */
  glassEffect: 'bg-[var(--theme-bg-primary)]/80 backdrop-blur-lg',

  /**
   * Standard border with theme color
   */
  themeBorder: 'border border-[var(--theme-border-primary)]/40',

  /**
   * Standard hover effect classes
   */
  hoverLift: 'hover:shadow-md hover:scale-105 transition-all duration-200',

  /**
   * Standard gradient text effect
   */
  gradientText: 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] bg-clip-text text-transparent'
};