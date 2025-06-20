// Temporary session storage (can be replaced with Redis later)
interface Session {
  created: number;
  authorized: boolean;
  userData?: {
    telegramId: string;
    firstName: string;
    lastName: string | null;
    username: string | null;
  };
}

const sessions = new Map<string, Session>();

export function createSession(): string {
  const sessionId = Math.random().toString(36).substring(7);
  sessions.set(sessionId, {
    created: Date.now(),
    authorized: false
  });
  
  // Delete after 10 minutes
  setTimeout(() => sessions.delete(sessionId), 600000);
  
  return sessionId;
}

export function authorizeSession(sessionId: string, userData: Session['userData']): boolean {
  const session = sessions.get(sessionId);
  if (session) {
    session.authorized = true;
    session.userData = userData;
    return true;
  } else {
    console.warn(`Attempted to authorize non-existent session: ${sessionId}`);
    return false;
  }
}

export function checkSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  
  // Check if session expired (10 minutes)
  if (Date.now() - session.created > 600000) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}