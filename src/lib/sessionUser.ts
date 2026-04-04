type SessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
    role?: string | null;
  };
} | null | undefined;

export function getSessionRole(session: SessionLike) {
  return session?.user?.role ?? null;
}

export function getSessionUserId(session: SessionLike) {
  return session?.user?.id ?? null;
}

export function getSessionUserEmail(session: SessionLike) {
  return session?.user?.email ?? null;
}
