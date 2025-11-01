import { Assignment, ShiftConfig, CrewMember } from './types';

/**
 * Generate dates for the current month view (including padding from prev/next month)
 */
export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Adjust to Monday-based week (0 = Monday, 6 = Sunday)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Add dates from previous month if needed
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startOffset);
  
  // Generate 5-6 weeks (35-42 days) to cover the entire month
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Only include dates that are in the target month or needed for padding
    if (i < 35 || currentDate.getMonth() === month) {
      dates.push(formatDate(currentDate));
    }
  }
  
  // Trim to complete weeks only
  const weeksNeeded = Math.ceil(dates.length / 7);
  return dates.slice(0, weeksNeeded * 7);
}

/**
 * Generate dates for a 7-day week view starting from a given date
 * Shows the next 7 days from startDate (not Monday-Sunday week)
 */
export function getWeekDates(startDate: Date = new Date()): string[] {
  const dates: string[] = [];

  // Start from the given date (today or specified date)
  const date = new Date(startDate);

  // Generate next 7 days from startDate
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(date);
    currentDate.setDate(date.getDate() + i);
    dates.push(formatDate(currentDate));
  }

  return dates;
}

/**
 * Get today's date
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display (e.g., "Jan 15" or "15")
 */
export function formatDateDisplay(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const date = parseDate(dateStr);
  const day = date.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (format === 'short') {
    return `${monthNames[date.getMonth()]} ${day}`;
  }

  return `${monthNames[date.getMonth()]} ${day}, ${date.getFullYear()}`;
}

/**
 * Get day name from date string
 */
export function getDayName(dateStr: string): string {
  const date = parseDate(dateStr);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[date.getDay()];
}

/**
 * Detect pattern in assignments and continue it
 */
export function detectAndContinuePattern(
  assignments: Assignment[],
  dates: string[],
  shiftId: string,
  crewMembers: CrewMember[],
  filterByInterior: boolean = true
): Assignment[] {
  // Filter crew members by department AND exclude on-leave and off-duty crew
  const filteredCrew = filterByInterior
    ? crewMembers.filter((c) => c.department === 'Interior' && c.status !== 'on-leave' && c.status !== 'off-duty')
    : crewMembers.filter((c) => c.status !== 'on-leave' && c.status !== 'off-duty');
  // Get all assignments for this shift, sorted by date
  const shiftAssignments = assignments
    .filter((a) => a.shiftId === shiftId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (shiftAssignments.length === 0) return [];

  // Group by date to find the pattern
  const dateGroups = new Map<string, Assignment[]>();
  shiftAssignments.forEach((a) => {
    if (!dateGroups.has(a.date)) {
      dateGroups.set(a.date, []);
    }
    dateGroups.get(a.date)!.push(a);
  });

  const assignedDates = Array.from(dateGroups.keys()).sort();
  if (assignedDates.length === 0) return [];

  // Find the pattern length
  const patternLength = assignedDates.length;
  
  // Get the pattern of crew assignments
  const pattern: Assignment[][] = assignedDates.map((date) => dateGroups.get(date)!);

  // Continue the pattern for remaining dates
  const newAssignments: Assignment[] = [];
  const lastAssignedDate = assignedDates[assignedDates.length - 1];
  const lastAssignedIndex = dates.indexOf(lastAssignedDate);

  if (lastAssignedIndex === -1) return [];

  // Continue from the next day
  for (let i = lastAssignedIndex + 1; i < dates.length; i++) {
    const patternIndex = (i - assignedDates.indexOf(assignedDates[0])) % patternLength;
    const patternAssignments = pattern[patternIndex];

    patternAssignments.forEach((pa) => {
      // Only add if the crew member is in the filtered list
      const crewExists = filteredCrew.some((c) => c.id === pa.crewId);
      if (crewExists) {
        newAssignments.push({
          crewId: pa.crewId,
          date: dates[i],
          shiftId: pa.shiftId,
          type: pa.type,
        });
      }
    });
  }

  return newAssignments;
}

/**
 * Auto-fill assignments evenly across dates
 */
export function autoFillAssignments(
  dates: string[],
  shifts: ShiftConfig[],
  crewMembers: CrewMember[],
  filterByInterior: boolean = true
): Assignment[] {
  // Filter crew members by department AND exclude on-leave and off-duty crew
  const filteredCrew = filterByInterior
    ? crewMembers.filter((c) => c.department === 'Interior' && c.status !== 'on-leave' && c.status !== 'off-duty')
    : crewMembers.filter((c) => c.status !== 'on-leave' && c.status !== 'off-duty');

  if (filteredCrew.length === 0) {
    return [];
  }

  const assignments: Assignment[] = [];
  let crewIndex = 0;

  shifts.forEach((shift) => {
    dates.forEach((date) => {
      // Assign primary crew
      for (let i = 0; i < shift.primaryCount; i++) {
        if (crewIndex >= filteredCrew.length) crewIndex = 0;
        assignments.push({
          crewId: filteredCrew[crewIndex].id,
          date,
          shiftId: shift.id,
          type: 'primary',
        });
        crewIndex++;
      }

      // Assign backup crew
      for (let i = 0; i < shift.backupCount; i++) {
        if (crewIndex >= filteredCrew.length) crewIndex = 0;
        assignments.push({
          crewId: filteredCrew[crewIndex].id,
          date,
          shiftId: shift.id,
          type: 'backup',
        });
        crewIndex++;
      }
    });
  });

  return assignments;
}
