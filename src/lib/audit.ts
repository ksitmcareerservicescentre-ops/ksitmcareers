import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Persists an immutable security/system event to the audit_logs table.
 */
export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
    });
  } catch (error) {
    // Non-blocking: log to console so audit failure does not break core business flow
    console.error("Failed to write audit log:", error);
  }
}
