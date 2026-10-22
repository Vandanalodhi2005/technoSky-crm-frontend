"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];
const SOURCES = ["Website", "Referral", "LinkedIn", "Other"];
const SERVICES = [
  "Web Development",
  "Software Development",
  "Mobile App Development",
  "Cloud & IT Support",
  "Other",
];
const emptyLead = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: SERVICES[0],
  status: "New",
  source: "Website",
  notes: "",
  assignedTo: "",
};

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "The request could not be completed.");
  }

  return result;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({ label, value, detail, icon, tone }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <p className="muted stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <section className="welcome-row admin-welcome">
      <div>
        <div className="eyebrow">
          <span className="live-dot" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="panel admin-empty" aria-live="polite">
      Loading admin data…
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="alert error-alert" role="alert">
      <span>{message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await requestJson("/admin/dashboard");
      setData(result.data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState />;

  const wonCount =
    data.statusCounts.find((item) => item._id === "Won")?.count || 0;
  const qualifiedCount = data.statusCounts
    .filter((item) => ["Qualified", "Proposal Sent", "Won"].includes(item._id))
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE HEALTH"
        title="Admin overview"
        description="Monitor CRM activity, accounts, and lead outcomes."
      />
      <section className="stats-grid admin-stats-grid">
        <StatCard
          icon="♙"
          label="Total leads"
          value={data.totalLeads}
          detail="Across the workspace"
          tone="blue-icon"
        />
        <StatCard
          icon="♧"
          label="Registered users"
          value={data.totalUsers}
          detail="Verified accounts"
          tone="purple-icon"
        />
        <StatCard
          icon="◈"
          label="Qualified pipeline"
          value={qualifiedCount}
          detail="Qualified, proposals and won"
          tone="orange-icon"
        />
        <StatCard
          icon="↗"
          label="Deals won"
          value={wonCount}
          detail="Successfully converted"
          tone="green-icon"
        />
      </section>

      <section className="panel admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent leads</h2>
            <p className="muted">Latest records across your workspace.</p>
          </div>
          <a className="secondary-button" href="/admin/leads">
            Manage leads
          </a>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>LEAD</th>
                <th>STATUS</th>
                <th>SOURCE</th>
                <th>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeads.length === 0 ? (
                <tr>
                  <td colSpan="4">No leads have been added yet.</td>
                </tr>
              ) : (
                data.recentLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <strong>{lead.name}</strong>
                      <small className="admin-cell-secondary">
                        {lead.company || lead.email || "No company"}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-status status-${lead.status.toLowerCase().replaceAll(" ", "-")}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.source}</td>
                    <td>{formatDate(lead.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState(emptyLead);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status !== "All") params.set("status", status);
      const [result, usersResult] = await Promise.all([
        requestJson(`/admin/leads?${params.toString()}`),
        requestJson("/admin/users"),
      ]);
      setLeads(result.data);
      setUsers(usersResult.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  function startEdit(lead) {
    setEditingId(lead._id);
    setForm({
      name: lead.name || "",
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      service: lead.service || SERVICES[0],
      status: lead.status || "New",
      source: lead.source || "Website",
      notes: lead.notes || "",
      assignedTo: lead.assignedTo?._id || lead.assignedTo || "",
    });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function startCreate() {
    setEditingId("");
    setForm(emptyLead);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  async function saveLead(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestJson(
        editingId ? `/admin/leads/${editingId}` : "/admin/leads",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(form),
        }
      );
      setShowForm(false);
      setNotice(editingId ? "Lead updated." : "Lead created.");
      setEditingId("");
      setForm(emptyLead);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Permanently delete lead “${lead.name}”?`)) return;
    setError("");
    setNotice("");
    try {
      await requestJson(`/admin/leads/${lead._id}`, { method: "DELETE" });
      setNotice("Lead permanently deleted.");
      await load();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function setField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <>
      <PageHeading
        eyebrow="CRM RECORDS"
        title="Lead management"
        description="Create, search, update, and remove workspace leads."
        action={
          <button className="primary-button" onClick={startCreate}>
            ＋ Add lead
          </button>
        }
      />
      {error && <ErrorState message={error} onRetry={load} />}
      {notice && (
        <div className="alert success-alert" role="status">
          {notice}
          <button onClick={() => setNotice("")}>Dismiss</button>
        </div>
      )}

      {showForm && (
        <section className="panel admin-panel">
          <div className="panel-heading">
            <div>
              <h2>{editingId ? "Edit lead" : "Create lead"}</h2>
              <p className="muted">Lead details are shared across the workspace.</p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Close lead form"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
          </div>
          <form className="admin-form-grid" onSubmit={saveLead}>
            <label>
              Name *
              <input name="name" value={form.name} onChange={setField} minLength={2} maxLength={100} required />
            </label>
            <label>
              Company
              <input name="company" value={form.company} onChange={setField} maxLength={150} />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={setField} maxLength={254} />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={setField} maxLength={25} />
            </label>
            <label>
              Service *
              <select name="service" value={form.service} onChange={setField}>
                {SERVICES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={setField}>
                {STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Source
              <select name="source" value={form.source} onChange={setField}>
                {SOURCES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Assigned employee
              <select name="assignedTo" value={form.assignedTo} onChange={setField}>
                <option value="">Unassigned</option>
                {users.filter((user) => (user.isActive && user.isApproved) || user._id === form.assignedTo).map((user) => (
                  <option key={user._id} value={user._id} disabled={!user.isActive || !user.isApproved}>
                    {user.name} · {user.email}{user.isApproved && user.isActive ? "" : " (not eligible)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-form-wide">
              Notes
              <textarea name="notes" value={form.notes} onChange={setField} maxLength={2000} rows={3} />
            </label>
            <div className="admin-form-actions admin-form-wide">
              <button className="primary-button" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Create lead"}
              </button>
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel admin-panel">
        <div className="admin-toolbar">
          <label className="table-search admin-search">
            <span>⌕</span>
            <input
              aria-label="Search leads"
              placeholder="Search name, company, email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select aria-label="Filter leads by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="secondary-button" onClick={load}>Refresh</button>
        </div>
        {loading ? <LoadingState /> : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>LEAD</th><th>SERVICE</th><th>STATUS</th><th>SOURCE</th><th>ASSIGNED TO</th><th>CREATED</th><th>ACTIONS</th></tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan="7">No leads match this filter.</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead._id}>
                    <td><strong>{lead.name}</strong><small className="admin-cell-secondary">{lead.company || lead.email || "—"}</small></td>
                    <td>{lead.service}</td>
                    <td><span className={`admin-status status-${lead.status.toLowerCase().replaceAll(" ", "-")}`}>{lead.status}</span></td>
                    <td>{lead.source}</td>
                    <td>{users.find((user) => user._id === (lead.assignedTo?._id || lead.assignedTo))?.name || "Unassigned"}</td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td><div className="admin-row-actions"><button className="secondary-button" onClick={() => startEdit(lead)}>Edit</button><button className="danger-button" onClick={() => deleteLead(lead)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer admin-table-footer">Showing {leads.length} leads (maximum 500)</div>
      </section>
    </>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const result = await requestJson(`/admin/users?${params.toString()}`);
      setUsers(result.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function toggleUser(user) {
    setBusyId(user._id);
    setError("");
    setNotice("");
    try {
      await requestJson(`/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setNotice(`${user.name}’s account ${user.isActive ? "suspended" : "restored"}.`);
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId("");
    }
  }

  async function toggleApproval(user) {
    setBusyId(user._id);
    setError("");
    setNotice("");
    try {
      await requestJson(`/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: !user.isApproved }),
      });
      setNotice(`${user.name}’s account ${user.isApproved ? "approval revoked" : "approved"}.`);
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId("");
    }
  }

  async function deleteUser(user) {
    const confirmed = window.confirm(
      `Permanently delete ${user.email}’s account? Their leads will not be deleted, but this cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(user._id);
    setError("");
    setNotice("");
    try {
      await requestJson(`/admin/users/${user._id}`, { method: "DELETE" });
      setNotice("User account permanently deleted. Leads were left unchanged.");
      await load();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT DIRECTORY"
        title="Registered users"
        description="Review verified accounts, suspend access, or remove an account."
      />
      {error && <ErrorState message={error} onRetry={load} />}
      {notice && <div className="alert success-alert" role="status">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
      <section className="panel admin-panel">
        <div className="admin-toolbar">
          <label className="table-search admin-search">
            <span>⌕</span>
            <input aria-label="Search users" placeholder="Search name or email…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button className="secondary-button" onClick={load}>Refresh</button>
        </div>
        {loading ? <LoadingState /> : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>USER</th><th>VERIFIED</th><th>JOINED</th><th>APPROVAL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {users.length === 0 ? <tr><td colSpan="6">No registered users found.</td></tr> : users.map((user) => (
                  <tr key={user._id}>
                    <td><strong>{user.name}</strong><small className="admin-cell-secondary">{user.email}</small></td>
                    <td>{formatDate(user.emailVerifiedAt)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td><span className={`admin-status ${user.isApproved ? "status-active" : "status-suspended"}`}>{user.isApproved ? "Approved" : "Pending approval"}</span></td>
                    <td><span className={`admin-status ${user.isActive ? "status-active" : "status-suspended"}`}>{user.isActive ? "Active" : "Suspended"}</span></td>
                    <td><div className="admin-row-actions"><button className="secondary-button" disabled={busyId === user._id} onClick={() => toggleApproval(user)}>{user.isApproved ? "Revoke approval" : "Approve"}</button><button className="secondary-button" disabled={busyId === user._id} onClick={() => toggleUser(user)}>{user.isActive ? "Suspend" : "Restore"}</button><button className="danger-button" disabled={busyId === user._id} onClick={() => deleteUser(user)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer admin-table-footer">Showing {users.length} users (maximum 500)</div>
      </section>
    </>
  );
}

function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await requestJson("/admin/reports");
      setData(result.data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const totals = useMemo(() => {
    if (!data) return { leads: 0, won: 0 };
    return {
      leads: data.monthly.reduce((sum, item) => sum + item.leads, 0),
      won: data.monthly.reduce((sum, item) => sum + item.won, 0),
    };
  }, [data]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Report", "Category", "Count"],
      ...data.byStatus.map((item) => ["Status", item._id || "Unknown", item.count]),
      ...data.bySource.map((item) => ["Source", item._id || "Unknown", item.count]),
      ...data.monthly.flatMap((item) => [
        ["Monthly leads", item._id, item.leads],
        ["Monthly won", item._id, item.won],
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => {
        const safeValue = String(value ?? "").replace(/^[=+\-@]/, "'$&");
        return `"${safeValue.replaceAll('"', '""')}"`;
      }).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "technosky-crm-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <><PageHeading eyebrow="PERFORMANCE" title="Reports" description="Lead outcomes, sources, and monthly activity." /><ErrorState message={error} onRetry={load} /></>;
  if (!data) return <><PageHeading eyebrow="PERFORMANCE" title="Reports" description="Lead outcomes, sources, and monthly activity." /><LoadingState /></>;

  const statusMax = Math.max(1, ...data.byStatus.map((item) => item.count));
  const sourceMax = Math.max(1, ...data.bySource.map((item) => item.count));

  return (
    <>
      <PageHeading
        eyebrow="PERFORMANCE"
        title="Reports"
        description="Understand lead outcomes, sources, and monthly activity."
        action={<button className="secondary-button" onClick={exportCsv}>Download CSV</button>}
      />
      <section className="stats-grid admin-stats-grid">
        <StatCard icon="♙" label="Leads · last 6 months" value={totals.leads} detail="Created during the reporting period" tone="blue-icon" />
        <StatCard icon="↗" label="Won · last 6 months" value={totals.won} detail="Successfully converted" tone="green-icon" />
        <StatCard icon="◈" label="Win rate" value={totals.leads ? `${Math.round((totals.won / totals.leads) * 100)}%` : "0%"} detail="Won divided by new leads" tone="purple-icon" />
        <StatCard icon="▥" label="Lead sources" value={data.bySource.length} detail="Sources with recorded activity" tone="orange-icon" />
      </section>
      <div className="admin-report-grid">
        <section className="panel admin-panel">
          <div className="panel-heading"><div><h2>Pipeline status</h2><p className="muted">All current leads by status.</p></div></div>
          <div className="admin-bars">
            {data.byStatus.length === 0 ? <p className="muted">No lead data yet.</p> : data.byStatus.map((item) => (
              <div className="admin-bar-row" key={item._id || "unknown"}>
                <div className="admin-bar-label"><span>{item._id || "Unknown"}</span><strong>{item.count}</strong></div>
                <div className="admin-bar-track"><span style={{ width: `${(item.count / statusMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel admin-panel">
          <div className="panel-heading"><div><h2>Lead sources</h2><p className="muted">Where the pipeline originates.</p></div></div>
          <div className="admin-bars">
            {data.bySource.length === 0 ? <p className="muted">No lead data yet.</p> : data.bySource.map((item) => (
              <div className="admin-bar-row" key={item._id || "unknown"}>
                <div className="admin-bar-label"><span>{item._id || "Unknown"}</span><strong>{item.count}</strong></div>
                <div className="admin-bar-track source-track"><span style={{ width: `${(item.count / sourceMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel admin-panel">
        <div className="panel-heading"><div><h2>Monthly activity</h2><p className="muted">Leads created in the last six months.</p></div></div>
        <div className="table-scroll"><table><thead><tr><th>MONTH</th><th>NEW LEADS</th><th>WON</th></tr></thead><tbody>
          {data.monthly.length === 0 ? <tr><td colSpan="3">No activity during this period.</td></tr> : data.monthly.map((item) => <tr key={item._id}><td>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${item._id}-01T00:00:00Z`))}</td><td>{item.leads}</td><td>{item.won}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}

function SettingsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await requestJson("/admin/settings");
      setData(result.data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <>
      <PageHeading eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Review service configuration without exposing secret values." />
      {error && <ErrorState message={error} onRetry={load} />}
      {!data ? <LoadingState /> : (
        <>
          <section className="panel admin-panel">
            <div className="panel-heading"><div><h2>Admin account</h2><p className="muted">Signed-in administrator identity.</p></div></div>
            <dl className="admin-settings-list">
              <div><dt>Username</dt><dd>{data.adminUsername}</dd></div>
              <div><dt>Admin sign-in page</dt><dd>/admin/login</dd></div>
              <div><dt>Session lifetime</dt><dd>{data.sessionDurationDays} days</dd></div>
            </dl>
          </section>
          <section className="panel admin-panel">
            <div className="panel-heading"><div><h2>Service status</h2><p className="muted">Only configuration status is shown. Secrets are never returned.</p></div></div>
            <div className="admin-settings-list">
              <div><dt>MongoDB</dt><dd><span className={`admin-status ${data.databaseConfigured ? "status-active" : "status-suspended"}`}>{data.databaseConfigured ? "Configured" : "Missing"}</span></dd></div>
              <div><dt>Verification email (SMTP)</dt><dd><span className={`admin-status ${data.emailDeliveryConfigured ? "status-active" : "status-suspended"}`}>{data.emailDeliveryConfigured ? "Configured" : "Not configured"}</span></dd></div>
              <div><dt>Frontend origin</dt><dd>{data.frontendOrigin}</dd></div>
              <div><dt>Public registration</dt><dd>{data.accountRegistrationEnabled ? "Enabled" : "Disabled"}</dd></div>
            </div>
          </section>
          <div className="alert error-alert admin-security-note" role="note">
            All registered accounts currently share the CRM lead workspace. Suspend or remove accounts from the Users page when access should end.
          </div>
        </>
      )}
    </>
  );
}

const sections = {
  dashboard: AdminDashboard,
  leads: LeadsPage,
  users: UsersPage,
  reports: ReportsPage,
  settings: SettingsPage,
};

export default function AdminSection({ section }) {
  const Component = sections[section];
  return Component ? <Component /> : null;
}
