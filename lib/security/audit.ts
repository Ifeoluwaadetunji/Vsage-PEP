import { createServiceClient } from '../supabase/server';

type AuditAction = 
  | 'login.success' 
  | 'login.failure' 
  | 'email.sent' 
  | 'email.deleted' 
  | 'attachment.downloaded' 
  | 'admin.user_created' 
  | 'api.rate_limited';

interface AuditLogOptions {
  userId?: string;
  action: AuditAction;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(options: AuditLogOptions) {
  // Fire and forget strategy so we don't block request flows on audit logging
  try {
    const supabase = await createServiceClient();
    
    // We don't await this directly to avoid blocking
    supabase.from('audit_logs').insert({
      user_id: options.userId,
      action: options.action,
      resource: options.resource,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      metadata: options.metadata
    }).then(({ error }) => {
      if (error) {
        console.error('[Audit Log Error]', error);
      }
    });
  } catch (err) {
    console.error('[Audit Init Error]', err);
  }
}
