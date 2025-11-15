/**
 * Password Generator Utilities
 * For creating secure temporary passwords for new crew members
 */

/**
 * Generate a random 4-digit PIN
 * Format: #### (e.g., 1234)
 */
export function generatePassword(): string {
  // Generate random 4-digit PIN (1000-9999)
  const pin = Math.floor(1000 + Math.random() * 9000);
  return pin.toString();
}

/**
 * Generate username from crew member name
 * Format: firstname (lowercase, no spaces) - like a nickname
 * If exists, append number
 */
export function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().trim().replace(/[^a-z]/g, '');

  return cleanFirst;
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
