// Firebase Client SDK Initializer with Fallback Mock Support
export interface AuthUserClient {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export function getStoredUser(): AuthUserClient | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('mediahub_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user: AuthUserClient | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('mediahub_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('mediahub_user');
  }
}
