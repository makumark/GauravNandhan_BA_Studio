import { prisma } from '@/lib/prisma';

interface AuditParams {
  organizationId: string;
  userId: string;
  userEmail: string;
  action: 'DOCUMENT_GENERATED' | 'SESSION_SAVED' | 'PDF_EXPORTED' | 'USER_INVITED' | 'USER_REMOVED' | 'ROLE_CHANGED' | 'LOGIN' | 'PROJECT_DELETED' | 'JIRA_SYNC' | 'TEST_SUITE_GENERATED' | 'PROJECT_LOADED';
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      }
    });
  } catch (err) {
    // Audit logging must NEVER break the main flow
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}
