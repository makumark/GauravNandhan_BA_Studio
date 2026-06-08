// ── Role hierarchy ─────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'BA_LEAD' | 'PM' | 'BA_ANALYST' | 'DEVELOPER' | 'QA_VIEWER' | 'VIEWER';

const ROLE_RANK: Record<UserRole, number> = {
  ADMIN: 100,
  BA_LEAD: 90,
  PM: 80,
  BA_ANALYST: 70,
  DEVELOPER: 50,
  QA_VIEWER: 40,
  VIEWER: 10,
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
export const canSaveSessions = (role?: string) => hasMinRole(role, 'DEVELOPER'); // Developers need to save PM state

/** Can sync to Jira */
export const canSyncJira = (role?: string) => hasMinRole(role, 'PM');

/** Can view audit logs */
export const canViewAuditLogs = (role?: string) => hasMinRole(role, 'BA_LEAD');

/** Can invite users, change roles, manage org */
export const canManageUsers = (role?: string) => hasMinRole(role, 'ADMIN');

/** Can access admin panel */
export const canAccessAdmin = (role?: string) => hasMinRole(role, 'ADMIN');

/** Is org admin */
export const isOrgAdmin = (role?: string) => role === 'ADMIN';

/** Can manage sprints and tasks */
export const canManageSprints = (role?: string) => hasMinRole(role, 'PM');

/** Can view sprint board */
export const canViewSprints = (role?: string) => hasMinRole(role, 'VIEWER');
