/**
 * Password Generator Utilities
 * For creating secure temporary passwords for new crew members
 */

/**
 * Generate a random password
 * Format: Word-####-Word (e.g., Ocean-2847-Wave)
 */
export function generatePassword(): string {
  const words = [
    'Anchor', 'Wave', 'Ocean', 'Yacht', 'Sail', 'Port', 'Star',
    'Marine', 'Deck', 'Crew', 'Captain', 'Harbor', 'Breeze', 'Tide'
  ];
  
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  
  return `${word1}${number}${word2}`;
}

/**
 * Generate username from crew member name
 * Format: firstname.lastname (lowercase, no spaces)
 * If exists, append number
 */
export function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().trim().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().trim().replace(/[^a-z]/g, '');
  
  return `${cleanFirst}.${cleanLast}`;
}

/**
 * Check if username exists and suggest alternative
 */
export async function generateUniqueUsername(
  firstName: string, 
  lastName: string,
  prisma: any
): Promise<string> {
  let username = generateUsername(firstName, lastName);
  let counter = 1;
  
  // Check if username exists
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${generateUsername(firstName, lastName)}${counter}`;
    counter++;
  }
  
  return username;
}
