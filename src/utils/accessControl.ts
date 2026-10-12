// Access Control Utility Functions
import { 
  ACCESS_CODE_HASH, 
  ACCESS_SESSION_KEY, 
  ACCESS_SESSION_DURATION,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION
} from '../config/accessConfig';

/**
 * Simple hash function for access code verification
 * Uses a combination of algorithms for reasonable security
 */
export function hashAccessCode(code: string): string {
  let hash = 0;
  const str = code.toLowerCase().trim();
  
  // Primary hash using djb2 algorithm
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Secondary hash using sdbm algorithm
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash2 = str.charCodeAt(i) + (hash2 << 6) + (hash2 << 16) - hash2;
    hash2 = hash2 & hash2;
  }
  
  // Combine hashes and convert to hex string
  const combined = Math.abs(hash).toString(16).padStart(8, '0') + 
                   Math.abs(hash2).toString(16).padStart(8, '0');
  
  return combined;
}

/**
 * Verify if the entered code matches the stored hash
 */
export function verifyAccessCode(code: string): boolean {
  const hashedCode = hashAccessCode(code);
  return hashedCode === ACCESS_CODE_HASH;
}

/**
 * Check if access is currently granted (session-based)
 */
export function hasAccess(): boolean {
  try {
    const accessData = sessionStorage.getItem(ACCESS_SESSION_KEY);
    if (!accessData) return false;
    
    const { timestamp, attempts } = JSON.parse(accessData);
    const now = Date.now();
    
    // Check if session has expired
    if (now - timestamp > ACCESS_SESSION_DURATION) {
      sessionStorage.removeItem(ACCESS_SESSION_KEY);
      return false;
    }
    
    // Check if locked out
    if (attempts >= MAX_ATTEMPTS) {
      const lockoutEnd = timestamp + LOCKOUT_DURATION;
      if (now < lockoutEnd) {
        return false;
      }
      // Lockout expired, reset attempts
      sessionStorage.removeItem(ACCESS_SESSION_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}

/**
 * Grant access and store in session
 */
export function grantAccess(): void {
  try {
    const accessData = {
      timestamp: Date.now(),
      attempts: 0,
      granted: true
    };
    sessionStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(accessData));
  } catch (error) {
    console.error('Error granting access:', error);
  }
}

/**
 * Record a failed access attempt
 */
export function recordFailedAttempt(): { attempts: number; lockedOut: boolean; lockoutEnd?: number } {
  try {
    const accessData = sessionStorage.getItem(ACCESS_SESSION_KEY);
    let attempts = 0;
    let timestamp = Date.now();
    
    if (accessData) {
      const data = JSON.parse(accessData);
      attempts = (data.attempts || 0) + 1;
      timestamp = data.timestamp || Date.now();
    }
    
    const lockedOut = attempts >= MAX_ATTEMPTS;
    const lockoutEnd = lockedOut ? timestamp + LOCKOUT_DURATION : undefined;
    
    sessionStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify({
      timestamp,
      attempts,
      granted: false
    }));
    
    return { attempts, lockedOut, lockoutEnd };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return { attempts: 0, lockedOut: false };
  }
}

/**
 * Get remaining lockout time in seconds
 */
export function getLockoutTimeRemaining(): number {
  try {
    const accessData = sessionStorage.getItem(ACCESS_SESSION_KEY);
    if (!accessData) return 0;
    
    const { timestamp, attempts } = JSON.parse(accessData);
    if (attempts < MAX_ATTEMPTS) return 0;
    
    const lockoutEnd = timestamp + LOCKOUT_DURATION;
    const remaining = lockoutEnd - Date.now();
    
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  } catch (error) {
    console.error('Error getting lockout time:', error);
    return 0;
  }
}

/**
 * Clear access (logout)
 */
export function clearAccess(): void {
  try {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing access:', error);
  }
}

/**
 * Generate hash for a new access code (utility for admins)
 * Usage: Call this in browser console to generate hash for a new code
 */
export function generateHashForCode(code: string): string {
  const hash = hashAccessCode(code);
  console.log(`Hash for "${code}": ${hash}`);
  console.log(`Add this to accessConfig.ts: export const ACCESS_CODE_HASH = '${hash}';`);
  return hash;
}

// Make generateHashForCode available in browser console for admin use
if (typeof window !== 'undefined') {
  (window as any).generateAccessHash = generateHashForCode;
}
