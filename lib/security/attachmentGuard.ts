// Common executable/script extensions that we should NEVER allow
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.js', '.ps1',
  '.scr', '.pif', '.msi', '.com', '.wsf', '.cpl', '.jar', '.apk', '.app'
]);

// Common dangerous mime types
const BLOCKED_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-sh',
  'application/javascript',
  'text/javascript',
  'text/x-javascript'
]);

export function isAttachmentSafe(filename: string, mimeType: string): boolean {
  // Extract extension properly taking last part after dot
  const parts = filename.split('.');
  const ext = parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return false;
  }
  
  if (BLOCKED_MIME_TYPES.has(mimeType)) {
    return false;
  }
  
  return true;
}

export function generateSafeStorageKey(userId: string, filename: string): string {
  // Create a safe, predictable path: userId/timestamp_safe-filename
  const timestamp = Date.now();
  // Remove non-alphanumeric (except dots/dashes)
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}_${safeFilename}`;
}
