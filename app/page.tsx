"use client";

import { useEffect, useState, useCallback } from "react";

const ENDPOINT_URL = "https://hamza-automation.duckdns.org/webhook/dashboard-data";

interface SummaryData {
  totalLeads: number;
  hot: number;
  warm: number;
  cold: number;
  needsReview?: number;
  rejectedCount?: number;
}

interface RecentLead {
  Timestamp?: string;
  "Full Name"?: string;
  Email?: string;
  "Company Name"?: string;
  Company?: string;
  Problem?: string;
  Budget?: string;
  Status?: string;
}

interface RejectedLead {
  Timestamp?: string;
  "Full Name"?: string;
  Email?: string;
  Company?: string;
  Problem?: string;
  Reason?: string;
}

interface DashboardResponse {
  summary: SummaryData;
  recentLeads: RecentLead[];
  rejected: RejectedLead[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(ENDPOINT_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Webhook returned HTTP ${res.status}: ${res.statusText || "Failed to load dashboard data"}`);
      }

      const json = await res.json();
      
      // Defensively parse payload structure
      const parsedData: DashboardResponse = {
        summary: {
          totalLeads: Number(json?.summary?.totalLeads ?? 0),
          hot: Number(json?.summary?.hot ?? 0),
          warm: Number(json?.summary?.warm ?? 0),
          cold: Number(json?.summary?.cold ?? 0),
          needsReview: Number(json?.summary?.needsReview ?? 0),
          rejectedCount: Number(json?.summary?.rejectedCount ?? (Array.isArray(json?.rejected) ? json.rejected.length : 0)),
        },
        recentLeads: Array.isArray(json?.recentLeads) ? json.recentLeads : [],
        rejected: Array.isArray(json?.rejected) ? json.rejected : [],
      };

      setData(parsedData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load data from webhook endpoint.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Clean status badges in emerald, amber, and slate
  const getStatusBadge = (statusRaw?: string) => {
    const status = (statusRaw || "UNKNOWN").toUpperCase();
    if (status.includes("HOT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider rounded-[4px] bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          HOT
        </span>
      );
    }
    if (status.includes("WARM")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider rounded-[4px] bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
          WARM
        </span>
      );
    }
    if (status.includes("COLD")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider rounded-[4px] bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
          COLD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider rounded-[4px] bg-[#f8fafc] text-[#334155] border border-[#e2e8f0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
        {status}
      </span>
    );
  };

  const filteredLeads = (data?.recentLeads || []).filter((lead) => {
    if (statusFilter === "ALL") return true;
    const st = (lead.Status || "").toUpperCase();
    return st.includes(statusFilter);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header / Ops Bar */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#e2e8f0]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#065f46] bg-[#ecfdf5] border border-[#a7f3d0] rounded-[4px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                Internal Ops
              </span>
              <span className="text-xs font-mono text-[#64748b]">
                PIPELINE // LEAD_QUAL_V1
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
              Lead Qualification Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-[#64748b]">
              Real-time inbound lead scoring, budget qualification & spam telemetry
            </p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            {/* Last updated indicator */}
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#94a3b8]">
                Last Refreshed
              </div>
              <div className="text-xs font-mono font-medium text-[#475569]">
                {lastUpdated ? lastUpdated : "Pending initial load..."}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium tracking-wide uppercase text-[#0f172a] hover:text-[#065f46] bg-[#ffffff] hover:bg-[#ecfdf5] active:bg-[#d1fae5] border border-[#e2e8f0] hover:border-[#a7f3d0] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Re-fetch live data from production endpoint"
            >
              <svg
                className={`w-3.5 h-3.5 text-[#059669] ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{refreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-[4px] flex items-start justify-between gap-3 text-sm text-[#991b1b] shadow-sm">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-[#7f1d1d]">Data Fetch Error</p>
                <p className="text-xs text-[#991b1b] mt-0.5">{error}</p>
                <p className="text-xs text-[#64748b] mt-1">Endpoint: <code className="font-mono text-[11px] text-[#991b1b]/80 bg-[#fee2e2] px-1 py-0.5 rounded">{ENDPOINT_URL}</code></p>
              </div>
            </div>
            <button
              onClick={() => fetchData(false)}
              className="px-2.5 py-1 text-xs font-mono font-medium text-[#7f1d1d] hover:text-[#450a0a] bg-[#ffffff] hover:bg-[#fee2e2] border border-[#fca5a5] rounded-[4px] shrink-0 shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section 1: Summary Stat Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Leads */}
            <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-[4px] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#64748b]">
                <span>Total Leads</span>
                <span className="text-[#94a3b8]">#ALL</span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-9 w-20 bg-[#f1f5f9] rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-mono font-bold text-[#0f172a]">
                    {data?.summary.totalLeads ?? 0}
                  </div>
                )}
                <p className="mt-1 text-xs text-[#64748b]">Processed across active campaigns</p>
              </div>
            </div>

            {/* Hot Leads (Emerald Green) */}
            <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-[4px] p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_1px_3px_rgba(16,185,129,0.08)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#059669]"></div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#065f46]">
                <span className="font-semibold">Hot Leads</span>
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-9 w-16 bg-[#ecfdf5] rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-mono font-bold text-[#047857]">
                    {data?.summary.hot ?? 0}
                  </div>
                )}
                <p className="mt-1 text-xs text-[#065f46]">
                  {data && data.summary.totalLeads > 0
                    ? `${Math.round((data.summary.hot / data.summary.totalLeads) * 100)}% of pipeline (High intent + budget)`
                    : "High intent + verified budget"}
                </p>
              </div>
            </div>

            {/* Warm Leads (Amber Gold) */}
            <div className="bg-[#ffffff] border border-[#fde68a] rounded-[4px] p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_1px_3px_rgba(245,158,11,0.06)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d97706]"></div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#b45309]">
                <span className="font-semibold">Warm Leads</span>
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-9 w-16 bg-[#fffbeb] rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-mono font-bold text-[#b45309]">
                    {data?.summary.warm ?? 0}
                  </div>
                )}
                <p className="mt-1 text-xs text-[#92400e]">
                  {data && data.summary.totalLeads > 0
                    ? `${Math.round((data.summary.warm / data.summary.totalLeads) * 100)}% of pipeline (Follow-up queue)`
                    : "Follow-up & qualification queue"}
                </p>
              </div>
            </div>

            {/* Cold Leads (Blue-Grey / Slate) */}
            <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[4px] p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_1px_3px_rgba(100,116,139,0.06)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#64748b]"></div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#475569]">
                <span className="font-semibold">Cold Leads</span>
                <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-9 w-16 bg-[#f1f5f9] rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-mono font-bold text-[#334155]">
                    {data?.summary.cold ?? 0}
                  </div>
                )}
                <p className="mt-1 text-xs text-[#64748b]">
                  {data && data.summary.totalLeads > 0
                    ? `${Math.round((data.summary.cold / data.summary.totalLeads) * 100)}% of pipeline (Nurture sequence)`
                    : "Automated nurture sequence"}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Recent Leads Table */}
        <section className="bg-[#ffffff] border border-[#e2e8f0] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#ffffff] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold tracking-tight text-[#0f172a]">
                  Qualified Inbound Leads
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono text-[#065f46] bg-[#ecfdf5] border border-[#a7f3d0] rounded-[4px]">
                  {data?.recentLeads?.length ?? 0} records
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                Incoming leads scored and categorized by automated workflow rules
              </p>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#f8fafc] p-1 border border-[#e2e8f0] rounded-[4px] text-xs font-mono self-start sm:self-auto">
              {["ALL", "HOT", "WARM", "COLD"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-[3px] transition-colors ${
                    statusFilter === tab
                      ? "bg-[#059669] text-white font-semibold shadow-xs"
                      : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#ffffff]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-mono uppercase tracking-wider text-[#64748b]">
                  <th className="py-3 px-4 sm:px-5">Name & Email</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4 sm:px-5 min-w-[280px]">Problem to Automate</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-sans">
                {loading ? (
                  // Skeleton loader rows
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="h-4 bg-[#f1f5f9] rounded w-28 mb-1.5"></div>
                        <div className="h-3 bg-[#f8fafc] rounded w-36"></div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-[#f1f5f9] rounded w-24"></div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-5 bg-[#f1f5f9] rounded w-16"></div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-[#f1f5f9] rounded w-20"></div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="h-4 bg-[#f1f5f9] rounded w-full"></div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="h-3 bg-[#f1f5f9] rounded w-12 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="text-xs font-mono text-[#64748b] uppercase tracking-wider">
                        {statusFilter === "ALL" ? "No lead records found" : `No leads matching status '${statusFilter}'`}
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        Submissions captured from the strategy call page will populate here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, idx) => {
                    const fullName = lead["Full Name"] || "—";
                    const email = lead.Email || "";
                    const company = lead["Company Name"] || lead.Company || "—";
                    const budget = lead.Budget || "—";
                    const problem = lead.Problem || "—";
                    const timestamp = lead.Timestamp ? new Date(lead.Timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-[#f8fafc] transition-colors group"
                      >
                        {/* Name & Email */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="font-medium text-[#0f172a] group-hover:text-[#059669] transition-colors">
                            {fullName}
                          </div>
                          {email && (
                            <div className="text-xs font-mono text-[#64748b]">
                              {email}
                            </div>
                          )}
                        </td>

                        {/* Company */}
                        <td className="py-3.5 px-4 text-sm text-[#334155] font-medium">
                          {company}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(lead.Status)}
                        </td>

                        {/* Budget */}
                        <td className="py-3.5 px-4 text-xs font-mono font-semibold text-[#0f172a]">
                          {budget}
                        </td>

                        {/* Problem Description with hover title */}
                        <td className="py-3.5 px-4 sm:px-5 max-w-xs">
                          <p
                            className="text-xs text-[#475569] truncate cursor-help hover:text-[#0f172a]"
                            title={problem}
                          >
                            {problem}
                          </p>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-xs font-mono text-[#64748b] whitespace-nowrap">
                          {timestamp}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Secondary / Collapsed Rejected Submissions */}
        <section className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#334155]">
                    Spam Filter & Rejected Submissions
                  </h3>
                  <span className="px-1.5 py-0.2 text-[10px] font-mono text-[#64748b] bg-[#ffffff] border border-[#e2e8f0] rounded-[3px]">
                    {data?.summary.rejectedCount ?? (data?.rejected?.length ?? 0)} blocked
                  </span>
                </div>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Filtered via honeypot detection, domain validation, and policy checks
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRejected(!showRejected)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#475569] hover:text-[#0f172a] bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-[4px] self-start sm:self-auto transition-colors shadow-xs"
            >
              <span>{showRejected ? "Hide Audit Log" : "View Audit Log"}</span>
              <svg
                className={`w-3.5 h-3.5 text-[#64748b] transition-transform duration-150 ${
                  showRejected ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Toggleable Rejected Table */}
          {showRejected && (
            <div className="mt-4 pt-4 border-t border-[#e2e8f0] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans bg-[#ffffff] border border-[#e2e8f0] rounded-[4px]">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Problem</th>
                    <th className="py-2.5 px-3 text-right">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-[#475569]">
                  {(!data?.rejected || data.rejected.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs font-mono text-[#64748b]">
                        No rejected submissions currently recorded in audit trail.
                      </td>
                    </tr>
                  ) : (
                    data.rejected.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#f8fafc]">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748b] whitespace-nowrap">
                          {item.Timestamp ? new Date(item.Timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#0f172a]">
                          {item["Full Name"] || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748b]">
                          {item.Email || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-[#334155]">
                          {item.Company || "—"}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-[#64748b]" title={item.Problem || ""}>
                          {item.Problem || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]">
                            {item.Reason || "Spam Trigger"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer / Telemetry metadata */}
        <footer className="pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748b] font-mono gap-2">
          <div>
            System: <span className="text-[#0f172a] font-medium">n8n Automation Engine</span> | Endpoint: <span className="text-[#065f46] font-semibold">/webhook/dashboard-data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span className="text-[#065f46] font-medium">Production Webhook Active</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
