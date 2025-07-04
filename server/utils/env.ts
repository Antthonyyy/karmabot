// Environment utilities
export function getCleanFrontendUrl(): string {
  const url = process.env.FRONTEND_URL || 'https://karma-diary.replit.app';
  // Remove 'FRONTEND_URL=' prefix if present (due to misconfigured secret)
  return url.replace(/^FRONTEND_URL=/, '');
}