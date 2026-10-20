import { base44 } from "@/api/base44Client";

// Writes an audit trail entry for the signed-in user. Shared by the field-service screens.
export async function logAudit({ action, module: moduleName, entityId, before, after }) {
  const user = await base44.auth.me().catch(() => null);
  return base44.entities.AuditLog.create({
    user_name: user?.full_name || user?.email || "Unknown user",
    user_id: user?.id,
    action,
    module: moduleName,
    entity_id: entityId,
    before_value: before,
    after_value: after,
  });
}