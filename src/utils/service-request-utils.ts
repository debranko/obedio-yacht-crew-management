/**
 * Service Request Utility Functions
 * Centralized utilities for service request display and formatting
 */

/**
 * Get Tailwind CSS classes for priority-based card styling
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'emergency':
      return 'bg-destructive/20 border-destructive text-destructive';
    case 'urgent':
      return 'bg-warning/20 border-warning text-warning';
    default:
      return 'bg-primary/10 border-primary/30 text-foreground';
  }
}

/**
 * Get Badge variant for priority display
 */
export function getPriorityBadgeColor(priority: string): 'destructive' | 'default' | 'secondary' {
  switch (priority) {
    case 'emergency':
      return 'destructive';
    case 'urgent':
      return 'default';
    default:
      return 'secondary';
  }
}

/**
 * Format timestamp as human-readable "time ago" string
 */
export function getTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
