export function getRoleFromToken(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(normalized)).role ?? null;
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  try {
    const stored = JSON.parse(localStorage.getItem('auth-storage'));
    return getRoleFromToken(stored?.state?.accessToken);
  } catch {
    return null;
  }
}
