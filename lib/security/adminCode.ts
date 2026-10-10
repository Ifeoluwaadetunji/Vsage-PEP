import crypto from 'crypto';

/**
 * Generates a 6-digit numeric admin code based on a secret and a date.
 * This code rotates every 24 hours (UTC).
 */
export function getDailyAdminCode(offsetDays: number = 0): string {
  const secret = process.env.ADMIN_INVITE_SECRET || 'default_dev_secret_change_me_in_prod';
  
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  
  // Format: YYYY-MM-DD (UTC)
  const dateString = date.toISOString().split('T')[0];
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dateString);
  
  // Convert hash to a 6-digit number
  const hashHex = hmac.digest('hex');
  const hashInt = parseInt(hashHex.substring(0, 8), 16);
  const code = (hashInt % 1000000).toString().padStart(6, '0');
  
  return code;
}

/**
 * Verifies the provided admin code against today's and yesterday's valid codes.
 * Checking yesterday's code prevents edge cases where the day rolls over 
 * right as a user is signing up.
 */
export function verifyAdminCode(code: string): boolean {
  if (!code) return false;
  
  const todayCode = getDailyAdminCode(0);
  const yesterdayCode = getDailyAdminCode(-1);
  
  return code === todayCode || code === yesterdayCode;
}
