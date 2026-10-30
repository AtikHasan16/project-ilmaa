import {
  getActiveUserCount,
  getAdminUsersAudit,
  getUserProfileMetrics,
  updateUserRole,
} from "./adminService";
import {
  clearAuditLogs,
  deleteAuditLog,
  getAuditLogs,
} from "./auditService";
import { getGrammarQuestions, getGrammarStats } from "./grammarService";
import {
  getFlashcardProgress,
  getSpellingProgress,
  getVocabularyProgress,
  recordFlashcardProgress,
  recordSpellingProgress,
  recordVocabularyProgress,
  resetFlashcardProgress,
  resetSpellingProgress,
  resetVocabularyProgress,
} from "./progressService";
import { recordStudySession } from "./studySessionService";
import {
  bulkImportVocabulary,
  createVocabulary,
  deleteVocabulary,
  getVocabulary,
  getVocabularyStats,
} from "./vocabularyService";

const apiClient = {
  async get(url, config = {}) {
    const params = config.params || {};

    switch (url) {
      case "/vocabulary/stats":
        return getVocabularyStats(params);
      case "/capacity/active-count":
        return getActiveUserCount();
      case "/vocabulary":
        return getVocabulary(params);
      case "/vocabulary/progress":
        return getVocabularyProgress(params);
      case "/grammar/stats":
        return getGrammarStats();
      case "/grammar/questions":
        return getGrammarQuestions(params);
      case "/user/profile-metrics":
        return getUserProfileMetrics(params);
      case "/admin/users-audit":
        return getAdminUsersAudit(params);
      case "/admin/audit-logs":
      case "/vocabulary/audit-logs":
        return getAuditLogs(params);
      case "/flashcard/progress":
        return getFlashcardProgress(params);
      case "/spelling/progress":
        return getSpellingProgress(params);
      default:
        throw new Error(`Unhandled GET endpoint: ${url}`);
    }
  },

  async post(url, body = {}) {
    switch (url) {
      case "/vocabulary/progress":
        return recordVocabularyProgress(body);
      case "/vocabulary/progress/reset":
        return resetVocabularyProgress(body);
      case "/flashcard/progress":
        return recordFlashcardProgress(body);
      case "/flashcard/progress/reset":
        return resetFlashcardProgress(body);
      case "/spelling/progress":
        return recordSpellingProgress(body);
      case "/spelling/progress/reset":
        return resetSpellingProgress(body);
      case "/user/study-session":
        return recordStudySession(body);
      case "/admin/profile-role":
        return updateUserRole(body);
      case "/vocabulary":
        return createVocabulary(body);
      case "/vocabulary/bulk":
        return bulkImportVocabulary(body);
      default:
        throw new Error(`Unhandled POST endpoint: ${url}`);
    }
  },

  async patch(url) {
    throw new Error(`Unhandled PATCH endpoint: ${url}`);
  },

  async delete(url, config = {}) {
    if (url === "/vocabulary/topic" || url.startsWith("/vocabulary/")) {
      return deleteVocabulary(url, config);
    }
    if (url.startsWith("/admin/audit-logs/")) {
      return deleteAuditLog(url);
    }
    if (url === "/admin/audit-logs") {
      return clearAuditLogs();
    }
    throw new Error(`Unhandled DELETE endpoint: ${url}`);
  },
};

export default apiClient;
