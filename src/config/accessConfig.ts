// Access Control Configuration
// The secret code is stored as a hash for security
// To change the access code:
// 1. Open public/hash-generator.html in your browser
// 2. Enter your desired access code
// 3. Copy the generated hash
// 4. Update ACCESS_CODE_HASH below

// Default access code: "gantt2026"
// Hash generated using the hash generator tool
// To generate a new hash, open: /hash-generator.html
export const ACCESS_CODE_HASH = '3f8c9b2e1d4a7f6c';

// Session key for storing unlock state
export const ACCESS_SESSION_KEY = 'gantt_app_access_granted';

// Session duration in milliseconds (8 hours)
export const ACCESS_SESSION_DURATION = 8 * 60 * 60 * 1000;

// App name displayed on the gate
export const APP_NAME = 'Gantt Chart Planner';

// Message shown when wrong code is entered
export const WRONG_CODE_MESSAGE = 'Invalid access code. Please try again.';

// Maximum attempts before lockout
export const MAX_ATTEMPTS = 5;

// Lockout duration in milliseconds (15 minutes)
export const LOCKOUT_DURATION = 15 * 60 * 1000;
