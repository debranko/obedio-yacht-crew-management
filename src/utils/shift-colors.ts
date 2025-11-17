/**
 * Dynamic color palette for shifts
 * Generates distinct colors for unlimited number of shifts
 */

// Predefined palette of distinct colors
const COLOR_PALETTE = [
  '#F59E0B', // Amber/Gold
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#4F46E5', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#6366F1', // Blue
  '#A855F7', // Violet
  '#EAB308', // Yellow
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F472B6', // Pink Light
  '#0EA5E9', // Sky Blue
  '#22C55E', // Green
];

/**
 * Get color for a shift by its index/order
 * Cycles through palette if more shifts than colors
 */
export function getShiftColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

/**
 * Get color for a shift, with fallback to dynamic generation
 */
export function getShiftColorSafe(color: string | undefined, index: number): string {
  // If color exists and is not default blue, use it
  if (color && color !== '#3B82F6') {
    return color;
  }

  // Otherwise generate color from palette
  return getShiftColor(index);
}

/**
 * Generate an array of colors for a given number of shifts
 */
export function generateShiftColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getShiftColor(i));
}
