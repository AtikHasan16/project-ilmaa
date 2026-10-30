import { supabase } from "./supabaseClient";
import { toCamel } from "./dataMappers";
import { queryCache, invalidateAuditCache } from "./queryCache";

/**
 * Audit log service
 * Records security, access, and administration event logs in Supabase.
 */
export async function getAuditLogs(params = {}) {
  const page = params.page ? Number(params.page) : null;
  const pageSize = params.pageSize ? Number(params.pageSize) : null;
  const limit = params.limit ? Number(params.limit) : null;
  const bypassCache = Boolean(params.bypassCache);

  const cacheKey = `audit:logs:${page || 1}:${pageSize || limit || 50}`;

  const fetcher = async () => {
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false });

    if (page && pageSize) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    } else if (limit) {
      query = query.limit(limit);
    } else {
      // Default safety bound: 50 records
      query = query.limit(50);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const logs = toCamel(data || []);
    return {
      data: {
        success: true,
        count: logs.length,
        totalCount: count ?? logs.length,
        page: page || 1,
        pageSize: pageSize || limit || 50,
        data: logs,
      },
    };
  };

  if (bypassCache) {
    queryCache.delete(cacheKey);
    return fetcher();
  }

  return queryCache.fetch(cacheKey, fetcher, 20000); // 20s TTL
}

export async function recordAuditLog(entry = {}) {
  const payload = {
    user_id: entry.userId || null,
    user_name: entry.userName || "System",
    action: entry.action || "EVENT",
    details: entry.details || "",
    target_user_id: entry.targetUserId || null,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("audit_logs")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.warn("Could not record audit log:", error.message);
    return null;
  }

  invalidateAuditCache();
  return toCamel(data);
}

export async function deleteAuditLog(url) {
  const id = url.split("/").pop();
  if (!id) throw new Error("Missing audit log id");

  const { error } = await supabase.from("audit_logs").delete().eq("id", id);
  if (error) throw error;

  invalidateAuditCache();

  return {
    data: {
      success: true,
      message: "Audit log deleted successfully",
    },
  };
}

export async function clearAuditLogs() {
  const { error } = await supabase
    .from("audit_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

  if (error) throw error;

  invalidateAuditCache();

  return {
    data: {
      success: true,
      message: "All audit logs cleared successfully",
    },
  };
}
