// ── Role hierarchy ─────────────────────────────────────────────────────────────
// ADMIN > BA_LEAD > BA_ANALYST > VIEWER
export type UserRole = 'ADMIN' | 'BA_LEAD' | 'BA_ANALYST' | 'VIEWER';

const ROLE_RANK: Record<UserRole, number> = {
  ADMIN: 4,
  BA_LEAD: 3,
  BA_ANALYST: 2,
  VIEWER: 1,
};

function hasMinRole(role: string | undefined, minRole: UserRole): boolean {
  if (!role) return false;
  return (ROLE_RANK[role as UserRole] ?? 0) >= ROLE_RANK[minRole];
}

// ── Permission checks ──────────────────────────────────────────────────────────

/** Can generate BRD, FRD, UML etc. */
export const canGenerateDocuments = (role?: string) => hasMinRole(role, 'BA_ANALYST');

/** Can export PDF / copy documents */
export const canExportDocuments = (role?: string) => hasMinRole(role, 'BA_ANALYST');

/** Can edit generated documents inline */
export const canEditDocuments = (role?: string) => hasMinRole(role, 'BA_ANALYST');

/** Can save sessions / projects */
export const canSaveSessions = (role?: string) => hasMinRole(role, 'BA_ANALYST');

/** Can sync to Jira */
export const canSyncJira = (role?: string) => hasMinRole(role, 'BA_LEAD');

/** Can view audit logs */
export const canViewAuditLogs = (role?: string) => hasMinRole(role, 'BA_LEAD');

/** Can invite users, change roles, manage org */
export const canManageUsers = (role?: string) => hasMinRole(role, 'ADMIN');

/** Can access admin panel */
export const canAccessAdmin = (role?: string) => hasMinRole(role, 'ADMIN');

/** Is org admin */
export const isOrgAdmin = (role?: string) => role === 'ADMIN';
