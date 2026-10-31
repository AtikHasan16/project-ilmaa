import { supabase } from "./supabaseClient";
import { requireSupabaseUserId, toCamel } from "./dataMappers";
import { recordAuditLog } from "./auditService";
import { queryCache, invalidateVocabularyCache } from "./queryCache";
import { telemetry } from "./telemetryService";

export async function getVocabularyStats(params = {}) {
  const cacheKey = `vocab:stats:${params.userId || "all"}:${params.userRole || "general"}`;

  return queryCache.fetch(cacheKey, async () => {
    // Attempt 1: Fast RPC (GROUP BY topic, target_tab)
    let groupedRows = null;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_vocabulary_topic_counts"
      );
      if (!rpcError && Array.isArray(rpcData)) {
        groupedRows = rpcData;
      }
    } catch {
      groupedRows = null;
    }

    const isAdmin = params.userRole === "admin";
    const byTopic = new Map();
    const uploadedTopicsMap = new Map();
    const activeTopicsMap = new Map();
    const listeningTopicsMap = new Map();
    let totalUploaded = 0;
    let totalCount = 0;

    if (groupedRows) {
      // Use pre-grouped database counts
      for (const row of groupedRows) {
        const count = Number(row.count) || 0;
        const topic = row.topic;
        const targetTab = row.target_tab;
        totalCount += count;
        byTopic.set(topic, (byTopic.get(topic) || 0) + count);

        if (targetTab === "listening") {
          listeningTopicsMap.set(
            topic,
            (listeningTopicsMap.get(topic) || 0) + count
          );
        } else if (targetTab === "active") {
          activeTopicsMap.set(
            topic,
            (activeTopicsMap.get(topic) || 0) + count
          );
        } else if (targetTab === "uploaded") {
          totalUploaded += count;
          uploadedTopicsMap.set(topic, {
            count,
            uploaderName:
              row.uploaded_by_name ||
              (isAdmin ? "Admin" : params.userName || "You"),
          });
        }
      }
    } else {
      // Fallback: Query columns and aggregate with adaptive column detection
      let allWords = null;

      // 1. Try normalized columns
      const res1 = await supabase
        .from("vocabularies")
        .select("topic, target_tab, uploaded_by_id, uploaded_by_name");

      if (!res1.error && res1.data) {
        allWords = res1.data;
      } else {
        // 2. Fallback to legacy schema (uploaded_by)
        const res2 = await supabase
          .from("vocabularies")
          .select("topic, target_tab, uploaded_by");

        if (!res2.error && res2.data) {
          allWords = res2.data.map((w) => ({
            topic: w.topic,
            target_tab: w.target_tab || "active",
            uploaded_by_name: w.uploaded_by || "Admin",
          }));
        } else {
          // 3. Fallback to minimal topic column
          const res3 = await supabase.from("vocabularies").select("topic");
          if (!res3.error && res3.data) {
            allWords = res3.data.map((w) => ({
              topic: w.topic,
              target_tab: "active",
              uploaded_by_name: "Admin",
            }));
          }
        }
      }

      for (const word of allWords || []) {
        const { topic, target_tab: targetTab } = word;
        totalCount += 1;
        byTopic.set(topic, (byTopic.get(topic) || 0) + 1);
        if (targetTab === "listening") {
          listeningTopicsMap.set(
            topic,
            (listeningTopicsMap.get(topic) || 0) + 1
          );
        } else if (targetTab === "uploaded") {
          totalUploaded += 1;
          const current = uploadedTopicsMap.get(topic);
          if (current) {
            current.count += 1;
          } else {
            uploadedTopicsMap.set(topic, {
              count: 1,
              uploaderName:
                word.uploaded_by_name ||
                (isAdmin ? "Admin" : params.userName || "You"),
            });
          }
        } else {
          // default to active
          activeTopicsMap.set(topic, (activeTopicsMap.get(topic) || 0) + 1);
        }
      }
    }

    return {
      data: {
        success: true,
        totalCount,
        uploadedCount: totalUploaded,
        byTopic: Object.fromEntries(byTopic),
        activeTopics: [...activeTopicsMap].map(([title, count]) => ({
          title,
          count,
        })),
        listeningTopics: [...listeningTopicsMap].map(([title, count]) => ({
          title,
          count,
        })),
        uploadedTopics: [...uploadedTopicsMap].map(([title, info]) => ({
          title,
          count: info.count,
          uploaderName: info.uploaderName,
        })),
      },
    };
  }, 45000); // 45-second cache
}

export async function getVocabulary(params = {}) {
  let query = supabase.from("vocabularies").select("*", { count: "exact" });
  if (params.topic) query = query.eq("topic", params.topic);
  if (params.targetTab) query = query.eq("target_tab", params.targetTab);
  if (params.uploadedOnly === "true" || params.uploadedOnly === true) {
    query = query.eq("target_tab", "uploaded");
  }

  // Pagination support
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const pageSize = Math.max(0, parseInt(params.pageSize || params.limit, 10) || 0);
  if (pageSize > 0) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  const words = toCamel(data || []);

  return {
    data: {
      success: true,
      count: words.length,
      totalCount: count ?? words.length,
      page,
      pageSize,
      data: words,
    },
  };
}

export async function createVocabulary(body = {}) {
  const {
    word,
    pos,
    banglaMeaning,
    synonyms,
    exampleUsage,
    topic,
    targetTab = "active",
  } = body;
  const synonymsList = Array.isArray(synonyms)
    ? synonyms
    : typeof synonyms === "string"
      ? synonyms.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  const item = {
    word: word.trim(),
    pos: (pos || "Unknown").trim(),
    bangla_meaning: banglaMeaning.trim(),
    synonyms: synonymsList,
    example_usage: (exampleUsage || "").trim(),
    topic: (topic || "Academic Word List: Sublist A").trim(),
  };

  const { data, error } = await supabase.rpc("submit_vocabulary_items", {
    p_items: [item],
    p_default_topic: item.topic,
    p_target_tab: targetTab,
  });
  if (error) {
    if (error.message?.includes("quota") || error.code === "P0001") {
      telemetry.trackQuotaRejection("current_user", 1, 200);
    }
    throw error;
  }
  if (data?.count !== 1) {
    throw new Error("The vocabulary RPC did not return the created row.");
  }

  invalidateVocabularyCache();

  return {
    data: {
      success: true,
      message: "Word uploaded successfully",
      data: toCamel(data.items?.[0] || item),
    },
  };
}

export async function bulkImportVocabulary(body = {}) {
  const {
    items,
    defaultTopic = "Uploaded",
    targetTab = "uploaded",
  } = body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No vocabulary items supplied for bulk import.");
  }

  const rpcItems = items.map((row) => {
    if (!row || typeof row !== "object") {
      throw new Error("Each vocabulary item must be an object.");
    }
    return {
      word: row.word,
      pos: row.pos || "Unknown",
      bangla_meaning: row.banglaMeaning,
      synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
      example_usage: row.exampleUsage || "",
      topic: row.topic || defaultTopic,
    };
  });

  const { data, error } = await supabase.rpc("submit_vocabulary_items", {
    p_items: rpcItems,
    p_default_topic: defaultTopic,
    p_target_tab: targetTab,
  });
  if (error) {
    if (error.message?.includes("quota") || error.code === "P0001") {
      telemetry.trackQuotaRejection("current_user", rpcItems.length, 200);
    }
    throw error;
  }
  if (data?.count !== rpcItems.length) {
    throw new Error("The vocabulary RPC returned an unexpected inserted count.");
  }

  invalidateVocabularyCache();

  return {
    data: {
      success: true,
      count: data.count,
      message: `Successfully imported ${data.count} words`,
    },
  };
}

export async function deleteVocabulary(url, config = {}) {
  invalidateVocabularyCache();

  if (url === "/vocabulary/topic") {
    const topic = config.data?.topic;
    const deletedByName = config.data?.deletedByName || "Admin";
    const deletedById = requireSupabaseUserId(config.data?.userId);
    if (!topic) throw new Error("Missing topic name to delete");

    const { data, error: selectError } = await supabase
      .from("vocabularies")
      .select("id")
      .eq("topic", topic);
    if (selectError) throw selectError;
    const count = data?.length || 0;
    const { error: deleteError } = await supabase
      .from("vocabularies")
      .delete()
      .eq("topic", topic);
    if (deleteError) throw deleteError;

    await recordAuditLog({
      userId: deletedById,
      action: "VOCAB_TOPIC_DELETED",
      userName: deletedByName,
      details: `Deleted topic "${topic}" (${count} words removed)`,
      timestamp: new Date().toISOString(),
    });

    return {
      data: {
        success: true,
        message: `Topic "${topic}" and all its ${count} words deleted successfully.`,
        deletedCount: count,
      },
    };
  }

  if (url.startsWith("/vocabulary/")) {
    const wordId = url.split("/")[2];
    const { error } = await supabase
      .from("vocabularies")
      .delete()
      .eq("id", wordId);
    if (error) throw error;
    return { data: { success: true, message: "Word deleted successfully" } };
  }

  throw new Error(`Unhandled DELETE endpoint: ${url}`);
}
