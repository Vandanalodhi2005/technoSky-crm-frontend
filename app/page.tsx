
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const initialForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: "Web Development",
  source: "Website",
  status: "New",
};

const navigation = [
  { icon: "▦", label: "Dashboard", href: "/" },
  { icon: "♙", label: "Leads", href: "/leads" },
  { icon: "♧", label: "Contacts", href: "/contacts" },
  { icon: "▤", label: "Companies", href: "/companies" },
  { icon: "◈", label: "Deals & Pipeline", href: "/deals" },
  { icon: "◷", label: "Tasks & Follow-ups", href: "/tasks" },
];

function StatCard({ icon, label, value, detail, color }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}>{icon}</span>
        <span className="stat-menu">•••</span>
      </div>
      <p className="muted stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = {
    New: "blue",
    Contacted: "purple",
    Qualified: "green",
    "Proposal Sent": "orange",
    Won: "green",
    Lost: "red",
  };

  return (
    <span className={`status-badge ${styles[status] || "blue"}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeNav = "Dashboard";
  const [currentTime, setCurrentTime] = useState(0);
  const [displayName, setDisplayName] = useState("Workspace Admin");

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/leads`, {
        credentials: "include",
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load leads.");
      }

      setLeads(result.data);
      setDisplayName(result.user?.name || "Workspace Admin");
    } catch (err) {
      setError(err.message || "Unable to connect to the CRM API.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadLeads, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLeads]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.company,
        lead.email,
        lead.service,
        lead.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [leads, search]);

  const qualifiedCount = leads.filter((lead) =>
    ["Qualified", "Proposal Sent", "Won"].includes(lead.status)
  ).length;

  const wonCount = leads.filter(
    (lead) => lead.status === "Won"
  ).length;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/leads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save lead.");
      }

      setLeads((previous) => [result.data, ...previous]);
      setForm(initialForm);
      setShowForm(false);
      setNotice("Lead added successfully.");
    } catch (err) {
      setError(err.message || "Unable to save the lead.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleLogout() {
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out. Please try again.");
      }

      router.replace("/login");
    } catch (logoutError) {
      setError(
        logoutError.message || "Unable to sign out. Please try again."
      );
    }
  }

  const userInitials = displayName
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="crm-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">T</span>
          <span>
            <strong>TECHNOSKY</strong>
            <small>CRM WORKSPACE</small>
          </span>
        </Link>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item ${
                activeNav === item.label ? "active" : ""
              }`}
              aria-current={activeNav === item.label ? "page" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "Leads" && (
                <span className="nav-count">{leads.length}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="workspace-label management-label">
          MANAGEMENT
        </div>

        <nav className="nav-list">
          {[
            { label: "Projects", href: "/projects", icon: "▣" },
            { label: "Team Members", href: "/team", icon: "♧" },
            { label: "Reports", href: "/reports", icon: "▥" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item ${
                activeNav === item.label ? "active" : ""
              }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link className="nav-item" href="/settings">
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </Link>
          <div className="sidebar-user">
            <div className="avatar">{userInitials}</div>
            <div className="user-info">
              <strong>{displayName}</strong>
              <small>Signed in</small>
            </div>
            <span className="user-menu">•••</span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <label className="global-search">
              <span>⌕</span>
              <input
                aria-label="Search leads"
                placeholder="Search leads, companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="secondary-button sign-out-button"
              onClick={handleLogout}
              type="button"
            >
              Sign out
            </button>
            <div className="avatar">{userInitials}</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />
                YOUR BUSINESS AT A GLANCE
              </div>
              <h1>
                Good morning, {displayName.split(/\s+/)[0]} <span>✦</span>
              </h1>
              <p className="muted">
                Here&apos;s what&apos;s happening with your business today.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                setError("");
                setNotice("");
                setShowForm((value) => !value);
              }}
            >
              <span>＋</span> Add New Lead
            </button>
          </section>

          {error && (
            <div className="alert error-alert" role="alert">
              <span>{error}</span>
              <button onClick={loadLeads}>Retry</button>
            </div>
          )}

          {notice && (
            <div className="alert success-alert" role="status">
              {notice}
              <button onClick={() => setNotice("")}>Dismiss</button>
            </div>
          )}

          {showForm && (
            <section className="panel lead-form-panel">
              <div className="panel-heading">
                <div>
                  <h2>Add a new lead</h2>
                  <p className="muted">Enter the prospect&apos;s details.</p>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <form className="lead-form" onSubmit={handleSubmit}>
                <label>
                  Full name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="e.g. Rahul Sharma"
                  />
                </label>

                <label>
                  Company
                  <input
                    name="company"
                    value={form.company}
                    onChange={updateField}
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="name@company.com"
                  />
                </label>

                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="Contact number"
                  />
                </label>

                <label>
                  Service *
                  <select
                    name="service"
                    value={form.service}
                    onChange={updateField}
                    required
                  >
                    <option>Web Development</option>
                    <option>Software Development</option>
                    <option>Mobile App Development</option>
                    <option>Cloud &amp; IT Support</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Lead source
                  <select
                    name="source"
                    value={form.source}
                    onChange={updateField}
                  >
                    <option>Website</option>
                    <option>Referral</option>
                    <option>LinkedIn</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Proposal Sent</option>
                    <option>Won</option>
                    <option>Lost</option>
                  </select>
                </label>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Lead"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="stats-grid">
            <StatCard
              icon="♙"
              label="Total Leads"
              value={loading ? "—" : leads.length}
              detail="Records in your CRM"
              color="blue-icon"
            />
            <StatCard
              icon="◈"
              label="Qualified Pipeline"
              value={loading ? "—" : qualifiedCount}
              detail="Qualified, proposals & won"
              color="purple-icon"
            />
            <StatCard
              icon="↗"
              label="Deals Won"
              value={loading ? "—" : wonCount}
              detail="Successfully converted"
              color="green-icon"
            />
            <StatCard
              icon="◷"
              label="Follow-ups Due"
              value={
                loading
                  ? "—"
                  : leads.filter(
                      (lead) =>
                        lead.nextFollowUp &&
                        currentTime !== null &&
                        new Date(lead.nextFollowUp).getTime() <= currentTime
                    ).length
              }
              detail="Scheduled for now or overdue"
              color="orange-icon"
            />
          </section>

          <section className="analytics-grid">
            <article className="panel sales-panel">
              <div className="panel-heading">
                <div>
                  <h2>Sales Overview</h2>
                  <p className="muted">Lead activity over the last 6 months</p>
                </div>
                <button className="period-button">Last 6 months⌄</button>
              </div>

              <div className="chart-legend">
                <span><i className="legend-blue" /> Lead activity</span>
                <span><i className="legend-cyan" /> Conversions</span>
              </div>

              <div className="chart-area">
                <div className="chart-y-labels">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                <div className="chart-plot">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <div className="chart-grid-line" key={line} />
                  ))}
                  <svg
                    className="line-chart"
                    viewBox="0 0 600 180"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Illustrative lead activity and conversions chart"
                  >
                    <defs>
                      <linearGradient
                        id="areaFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#5086ff" stopOpacity=".24" />
                        <stop offset="100%" stopColor="#5086ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 143 C40 132 55 119 100 125 S160 86 200 101 S260 115 300 78 S360 91 400 58 S465 72 500 39 S560 48 600 15 L600 180 L0 180 Z"
                      fill="url(#areaFill)"
                    />
                    <path
                      d="M0 143 C40 132 55 119 100 125 S160 86 200 101 S260 115 300 78 S360 91 400 58 S465 72 500 39 S560 48 600 15"
                      fill="none"
                      stroke="#638dff"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M0 160 C50 152 70 158 100 147 S160 136 200 143 S260 121 300 133 S360 116 400 122 S465 102 500 110 S560 89 600 82"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              <div className="chart-x-labels">
                {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
              <p className="chart-note">
                Preview data · Connect reporting metrics for actual historical trends.
              </p>
            </article>

            <article className="panel source-panel">
              <div className="panel-heading">
                <div>
                  <h2>Lead Sources</h2>
                  <p className="muted">Where prospects come from</p>
                </div>
                <button className="more-button" aria-label="More options">•••</button>
              </div>

              <div className="donut-wrap">
                <div className="donut-chart">
                  <div className="donut-center">
                    <strong>{loading ? "—" : leads.length}</strong>
                    <span>Total leads</span>
                  </div>
                </div>
              </div>

              <div className="source-legend">
                <div><i className="source-dot website" /><span>Website</span><strong>—</strong></div>
                <div><i className="source-dot referral" /><span>Referral</span><strong>—</strong></div>
                <div><i className="source-dot linkedin" /><span>LinkedIn</span><strong>—</strong></div>
                <div><i className="source-dot other" /><span>Other</span><strong>—</strong></div>
              </div>
              <p className="chart-note">
                Source percentages will be calculated from saved leads in the next iteration.
              </p>
            </article>
          </section>

          <section className="panel leads-panel">
            <div className="panel-heading leads-heading">
              <div>
                <h2>Recent Leads</h2>
                <p className="muted">Manage and track your latest prospects</p>
              </div>
              <div className="table-actions">
                <label className="table-search">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter leads..."
                    aria-label="Filter leads"
                  />
                </label>
                <button className="secondary-button" onClick={loadLeads}>
                  ↻ Refresh
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>LEAD / COMPANY</th>
                    <th>SERVICE</th>
                    <th>STATUS</th>
                    <th>LEAD SOURCE</th>
                    <th>CREATED</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        Loading your leads...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        {search
                          ? "No leads match your search."
                          : "No leads yet. Select Add New Lead to create your first record."}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead._id}>
                        <td>
                          <div className="lead-identity">
                            <div className="lead-avatar">
                              {(lead.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{lead.name}</strong>
                              <span>{lead.company || lead.email || "No company added"}</span>
                            </div>
                          </div>
                        </td>
                        <td>{lead.service}</td>
                        <td><StatusBadge status={lead.status} /></td>
                        <td>{lead.source}</td>
                        <td>
                          {new Date(lead.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {filteredLeads.length} of {leads.length} leads</span>
              <span>Maximum 100 records in this view</span>
            </div>
          </section>

          <footer className="page-footer">
            <span>
              © {currentTime ? new Date(currentTime).getFullYear() : ""}{" "}
              Technosky Solution
            </span>
            <span>CRM Workspace · Built for better business</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
