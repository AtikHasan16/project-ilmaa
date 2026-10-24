import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import {
  HiCheck,
  HiXMark,
  HiKey,
  HiUsers,
  HiClock,
} from "react-icons/hi2";

export default function AdminDashboardPage() {
  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("general");
  const [generating, setGenerating] = useState(false);
  const [generatedUser, setGeneratedUser] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await apiClient.get("/admin/access-requests");
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load access requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleGenerateId = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setGenerating(true);
    try {
      const res = await apiClient.post("/admin/access-ids", {
        name: candidateName.trim(),
        role: candidateRole,
      });

      if (res.data?.success) {
        setGeneratedUser(res.data.data);
        setCandidateName("");
      }
    } catch (err) {
      console.error("Generate ID failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (accessId) => {
    try {
      const res = await apiClient.patch(`/admin/access-requests/${accessId}/approve`, {});
      if (res.data?.success) {
        setActionMessage(`Approved Access ID: ${accessId}`);
        fetchRequests();
      }
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  const handleReject = async (accessId) => {
    try {
      const res = await apiClient.patch(`/admin/access-requests/${accessId}/reject`, {});
      if (res.data?.success) {
        setActionMessage(`Rejected Access ID: ${accessId}`);
        fetchRequests();
      }
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-10">
      <div>
        <h2 className="text-3xl font-black text-body-dark tracking-tight">
          Admin Dashboard
        </h2>
        <p className="text-lg text-muted-label mt-1">
          Generate unique 10-digit IDs, manage permissions, and approve incoming device requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generate Access ID Card */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="imlaa-card p-6 sm:p-8">
            <div className="flex items-center space-x-3 text-plum mb-4">
              <HiKey className="w-6 h-6" />
              <h3 className="text-xl font-bold text-body-dark">
                Issue 10-Digit ID
              </h3>
            </div>

            <form onSubmit={handleGenerateId} className="space-y-5">
              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="imlaa-input text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Assigned Role
                </label>
                <select
                  value={candidateRole}
                  onChange={(e) => setCandidateRole(e.target.value)}
                  className="imlaa-input text-base"
                >
                  <option value="general">General (Vocabulary + Grammar)</option>
                  <option value="advance">Advance (+ Upload to Study)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating || !candidateName.trim()}
                className="imlaa-btn-primary w-full py-3.5 text-base"
              >
                {generating ? "Generating..." : "Generate 10-Digit Access ID"}
              </button>
            </form>

            {/* Newly Generated ID Card */}
            {generatedUser && (
              <div className="mt-6 p-4 rounded-xl border border-plum/25 bg-plum/5 text-base space-y-2">
                <div className="font-bold text-plum text-base">New Access ID Created:</div>
                <div className="text-body-dark font-medium">
                  Name: <span className="font-bold">{generatedUser.name}</span>
                </div>
                <div className="text-body-dark font-medium">
                  Role: <span className="capitalize font-bold">{generatedUser.role}</span>
                </div>
                <div className="pt-2 border-t border-plum/15 text-2xl font-mono font-black text-plum tracking-widest text-center">
                  {generatedUser.accessId}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending Device Requests Table */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="imlaa-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 text-plum">
                <HiUsers className="w-6 h-6" />
                <h3 className="text-xl font-bold text-body-dark">
                  Access Requests Queue
                </h3>
              </div>
              <span className="imlaa-badge text-base">
                {requests.length} Pending
              </span>
            </div>

            {actionMessage && (
              <div className="mb-4 p-3 rounded-lg bg-plum/10 text-plum text-base font-medium">
                {actionMessage}
              </div>
            )}

            {loadingRequests ? (
              <div className="p-8 text-center text-muted-label animate-pulse">
                Refreshing queue...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-muted-label flex flex-col items-center space-y-2">
                <HiClock className="w-8 h-8 text-plum/30" />
                <div>No pending access requests in the queue.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.accessId}
                    className="p-4 rounded-xl border border-plum/20 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-lg font-bold text-body-dark">
                        {req.name}
                      </div>
                      <div className="font-mono text-base text-plum font-semibold">
                        ID: {req.accessId}
                      </div>
                      <div className="text-base text-muted-label mt-0.5">
                        Role: <span className="capitalize">{req.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(req.accessId)}
                        className="imlaa-btn-primary py-2 px-4 text-base space-x-1"
                      >
                        <HiCheck className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.accessId)}
                        className="imlaa-btn-secondary py-2 px-4 text-base text-rose-700 border-rose-300 hover:bg-rose-50 space-x-1"
                      >
                        <HiXMark className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
