"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const navigation = [
  { href: "/", icon: "▦", label: "Dashboard" },
  { href: "/leads", icon: "♙", label: "Leads" },
  { href: "/contacts", icon: "♧", label: "Contacts" },
  { href: "/companies", icon: "▤", label: "Companies" },
  { href: "/deals", icon: "◈", label: "Deals & Pipeline" },
  { href: "/tasks", icon: "◷", label: "Tasks & Follow-ups" },
];
const management = [
  { href: "/projects", icon: "▣", label: "Projects" },
  { href: "/team", icon: "♧", label: "Team Members" },
  { href: "/reports", icon: "▥", label: "Reports" },
];
const leadStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];
const services = [
  "Web Development",
  "Software Development",
  "Mobile App Development",
  "Cloud & IT Support",
  "Other",
];
const initialLead = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: services[0],
  source: "Website",
  status: "New",
};

const pageInfo = {
  leads: {
    title: "Leads",
    eyebrow: "PROSPECT MANAGEMENT",
    description: "Track and organize prospective customers in your workspace.",
  },
  contacts: {
    title: "Contacts",
    eyebrow: "PEOPLE DIRECTORY",
    description: "People and contact details collected from your CRM leads.",
  },
  companies: {
    title: "Companies",
    eyebrow: "ACCOUNT DIRECTORY",
    description: "Organizations associated with prospects in your workspace.",
  },
  deals: {
    title: "Deals & Pipeline",
    eyebrow: "REVENUE PIPELINE",
    description: "See opportunities grouped by their current lead status.",
  },
  tasks: {
    title: "Tasks & Follow-ups",
    eyebrow: "FOLLOW-UP PLANNER",
    description: "Keep scheduled callbacks and next steps visible.",
  },
  projects: {
    title: "Projects",
    eyebrow: "DELIVERY MANAGEMENT",
    description: "A workspace for delivery projects linked to your CRM.",
  },
  team: {
    title: "Team Members",
    eyebrow: "WORKSPACE ACCESS",
    description: "Review accounts with access to this shared CRM workspace.",
  },
  reports: {
    title: "Reports",
    eyebrow: "WORKSPACE INSIGHTS",
    description: "A live summary of lead volume, outcomes, and sources.",
  },
  settings: {
    title: "Settings",
    eyebrow: "WORKSPACE CONFIGURATION",
    description: "Review your account and CRM service status.",
  },
};

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClass(value) {
  return `workspace-status workspace-status-${String(value || "")
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

function PageHeader({ section, action }) {
  const info = pageInfo[section];
  return (
    <section className="welcome-row workspace-page-heading">
      <div>
        <div className="eyebrow">
          <span className="live-dot" />
          {info.eyebrow}
        </div>
        <h1>{info.title}</h1>
        <p className="muted">{info.description}</p>
      </div>
      {action}
    </section>
  );
}

function Metric({ icon, label, value, detail, tone = "blue-icon" }) {
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

function StatusPill({ children }) {
  return <span className={statusClass(children)}>{children || "Unspecified"}</span>;
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="workspace-empty">
      <span className="workspace-empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function DataTable({ headers, children, emptyMessage, emptyColumnCount }) {
  return (
    <div className="panel workspace-data-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {children || (
              <tr>
                <td className="empty-state" colSpan={emptyColumnCount || headers.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadsView({ leads, refresh, busy, setBusy, setError, setNotice }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialLead);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const initialQuery = new URLSearchParams(window.location.search).get("q");
      if (initialQuery) setQuery(initialQuery);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const visibleLeads = useMemo(() => {
    const search = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = filter === "All statuses" || lead.status === filter;
      const matchesQuery =
        !search ||
        [lead.name, lead.company, lead.email, lead.service, lead.status]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return matchesStatus && matchesQuery;
    });
  }, [filter, leads, query]);

  async function createLead(event) {
    event.preventDefault();
    setBusy(true);
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
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not create the lead.");
      }
      setForm(initialLead);
      setShowForm(false);
      setNotice("Lead created successfully.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the lead.");
    } finally {
      setBusy(false);
    }
  }

  function updateField(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  return (
    <>
      <PageHeader
        section="leads"
        action={
          <button className="primary-button" onClick={() => setShowForm((value) => !value)}>
            ＋ Add lead
          </button>
        }
      />
      {showForm && (
        <section className="panel workspace-form-panel">
          <div className="panel-heading">
            <div><h2>Create a lead</h2><p className="muted">Add a prospect to the shared workspace.</p></div>
            <button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close lead form">×</button>
          </div>
          <form className="workspace-form-grid" onSubmit={createLead}>
            <label>Full name *<input name="name" value={form.name} onChange={updateField} minLength={2} maxLength={100} required /></label>
            <label>Company<input name="company" value={form.company} onChange={updateField} maxLength={150} /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={updateField} maxLength={254} /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={updateField} maxLength={25} /></label>
            <label>Service<select name="service" value={form.service} onChange={updateField}>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label>Source<select name="source" value={form.source} onChange={updateField}>{["Website", "Referral", "LinkedIn", "Other"].map((source) => <option key={source}>{source}</option>)}</select></label>
            <label>Status<select name="status" value={form.status} onChange={updateField}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <div className="workspace-form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save lead"}</button>
            </div>
          </form>
        </section>
      )}
      <div className="workspace-toolbar">
        <label className="table-search workspace-search"><span>⌕</span><input placeholder="Search name, company, email…" aria-label="Search leads" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select aria-label="Filter leads by status" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>All statuses</option>{leadStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <button className="secondary-button" onClick={refresh}>↻ Refresh</button>
      </div>
      <DataTable headers={["LEAD / COMPANY", "SERVICE", "STATUS", "SOURCE", "CREATED"]} emptyMessage={query || filter !== "All statuses" ? "No leads match these filters." : "No leads yet. Add your first prospect to start building the pipeline."}>
        {visibleLeads.map((lead) => (
          <tr key={lead._id}>
            <td><div className="lead-identity"><div className="lead-avatar">{(lead.name || "?").charAt(0).toUpperCase()}</div><div><strong>{lead.name}</strong><span>{lead.company || lead.email || "No company added"}</span></div></div></td>
            <td>{lead.service}</td><td><StatusPill>{lead.status}</StatusPill></td><td>{lead.source}</td><td>{dateLabel(lead.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
      <div className="table-footer workspace-table-footer">Showing {visibleLeads.length} of {leads.length} loaded leads · Maximum 100</div>
    </>
  );
}

function ContactsView({ leads }) {
  const [query, setQuery] = useState("");
  const contacts = useMemo(() => {
    const map = new Map();
    leads.forEach((lead) => {
      const key = (lead.email || `${lead.name}:${lead.phone || ""}`).toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.leadCount += 1;
      } else {
        map.set(key, { ...lead, leadCount: 1 });
      }
    });
    return [...map.values()].filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.company].join(" ").toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [leads, query]);

  return (
    <>
      <PageHeader section="contacts" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="♧" label="Unique contacts" value={contacts.length} detail="Derived from CRM leads" />
        <Metric icon="✉" label="With email" value={contacts.filter((contact) => contact.email).length} detail="Reachable email addresses" tone="purple-icon" />
        <Metric icon="▤" label="With company" value={contacts.filter((contact) => contact.company).length} detail="Associated with an organization" tone="green-icon" />
        <Metric icon="♙" label="Lead records" value={leads.length} detail="Source records in this view" tone="orange-icon" />
      </section>
      <div className="workspace-toolbar">
        <label className="table-search workspace-search"><span>⌕</span><input placeholder="Search contacts…" aria-label="Search contacts" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <span className="workspace-data-note">Contacts are generated from saved leads.</span>
      </div>
      <DataTable headers={["CONTACT", "COMPANY", "EMAIL", "PHONE", "LEAD RECORDS"]} emptyMessage="Contacts will appear here when leads are added.">
        {contacts.map((contact) => (
          <tr key={contact._id}>
            <td><div className="lead-identity"><div className="lead-avatar">{(contact.name || "?").charAt(0).toUpperCase()}</div><div><strong>{contact.name}</strong><span>Contact</span></div></div></td>
            <td>{contact.company || "—"}</td><td>{contact.email || "—"}</td><td>{contact.phone || "—"}</td><td>{contact.leadCount}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}

function CompaniesView({ leads }) {
  const [query, setQuery] = useState("");
  const companies = useMemo(() => {
    const map = new Map();
    leads.filter((lead) => lead.company?.trim()).forEach((lead) => {
      const key = lead.company.trim().toLowerCase();
      const company = map.get(key) || { name: lead.company.trim(), leads: 0, services: new Set(), latest: lead.createdAt };
      company.leads += 1;
      if (lead.service) company.services.add(lead.service);
      if (new Date(lead.createdAt) > new Date(company.latest)) company.latest = lead.createdAt;
      map.set(key, company);
    });
    return [...map.values()].filter((company) => company.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [leads, query]);

  return (
    <>
      <PageHeader section="companies" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="▤" label="Companies" value={companies.length} detail="Unique organizations in leads" />
        <Metric icon="♙" label="Associated leads" value={companies.reduce((count, company) => count + company.leads, 0)} detail="Leads with a company set" tone="purple-icon" />
        <Metric icon="◈" label="Services represented" value={new Set(companies.flatMap((company) => [...company.services])).size} detail="Across represented organizations" tone="green-icon" />
        <Metric icon="↗" label="Unassigned leads" value={leads.filter((lead) => !lead.company?.trim()).length} detail="No company provided" tone="orange-icon" />
      </section>
      <div className="workspace-toolbar">
        <label className="table-search workspace-search"><span>⌕</span><input placeholder="Search companies…" aria-label="Search companies" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <span className="workspace-data-note">Company records are derived from leads.</span>
      </div>
      <DataTable headers={["COMPANY", "LEADS", "SERVICES", "LATEST ACTIVITY"]} emptyMessage="Companies will appear here when a lead is linked to an organization.">
        {companies.map((company) => (
          <tr key={company.name}>
            <td><div className="lead-identity"><div className="lead-avatar">{company.name.charAt(0).toUpperCase()}</div><div><strong>{company.name}</strong><span>CRM account</span></div></div></td>
            <td>{company.leads}</td><td>{[...company.services].join(", ") || "—"}</td><td>{dateLabel(company.latest)}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}

function DealsView({ leads }) {
  const columns = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];
  const value = (lead) => Number(lead.value) || 0;

  return (
    <>
      <PageHeader section="deals" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="◈" label="Opportunities" value={leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length} detail="Open pipeline records" />
        <Metric icon="↗" label="Won" value={leads.filter((lead) => lead.status === "Won").length} detail="Successfully converted" tone="green-icon" />
        <Metric icon="◉" label="In proposal" value={leads.filter((lead) => lead.status === "Proposal Sent").length} detail="Proposal sent to prospect" tone="purple-icon" />
        <Metric icon="▤" label="Pipeline value" value={value(leads).toLocaleString("en-IN")} detail="Only where a value is available" tone="orange-icon" />
      </section>
      <div className="workspace-pipeline">
        {columns.map((status) => {
          const group = leads.filter((lead) => lead.status === status);
          return (
            <section className="pipeline-column" key={status}>
              <div className="pipeline-column-heading"><StatusPill>{status}</StatusPill><span>{group.length}</span></div>
              <div className="pipeline-card-list">
                {group.length === 0 ? <p className="pipeline-empty">No deals in this stage</p> : group.map((lead) => (
                  <article className="pipeline-card" key={lead._id}>
                    <strong>{lead.name}</strong>
                    <span>{lead.company || lead.service}</span>
                    <div><small>{lead.source || "Unknown source"}</small><small>{dateLabel(lead.createdAt)}</small></div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="workspace-data-note workspace-inline-note">Pipeline stages follow the current lead status. Deal values and drag-and-drop updates are not configured in the current CRM API.</p>
    </>
  );
}

function TasksView({ leads }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
  const tasks = leads
    .filter((lead) => lead.nextFollowUp)
    .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));
  const overdue = tasks.filter((lead) => new Date(lead.nextFollowUp).getTime() < now).length;

  return (
    <>
      <PageHeader section="tasks" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="◷" label="Scheduled follow-ups" value={tasks.length} detail="Linked to a lead record" />
        <Metric icon="!" label="Overdue" value={overdue} detail="Past the scheduled date" tone="orange-icon" />
        <Metric icon="♙" label="Leads without follow-up" value={leads.length - tasks.length} detail="No next follow-up date set" tone="purple-icon" />
        <Metric icon="✓" label="Upcoming" value={tasks.length - overdue} detail="Due today or later" tone="green-icon" />
      </section>
      <DataTable headers={["FOLLOW-UP", "LEAD", "COMPANY", "STATUS", "LEAD SOURCE"]} emptyMessage="No follow-ups are scheduled. Follow-up dates can be displayed here when the CRM API supports scheduling them.">
        {tasks.map((lead) => (
          <tr key={lead._id}><td>{dateLabel(lead.nextFollowUp)}</td><td><strong>{lead.name}</strong></td><td>{lead.company || "—"}</td><td><StatusPill>{lead.status}</StatusPill></td><td>{lead.source || "—"}</td></tr>
        ))}
      </DataTable>
      <p className="workspace-data-note workspace-inline-note">Task creation and completion are not connected to a task API yet. Existing follow-up dates on lead records are shown above.</p>
    </>
  );
}

function ProjectsView() {
  return (
    <>
      <PageHeader section="projects" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="▣" label="Active projects" value="—" detail="Project storage is not configured" />
        <Metric icon="◷" label="Upcoming deadlines" value="—" detail="Project API required" tone="purple-icon" />
        <Metric icon="♧" label="Team assignments" value="—" detail="Project API required" tone="green-icon" />
        <Metric icon="✓" label="Completed" value="—" detail="Project API required" tone="orange-icon" />
      </section>
      <section className="panel workspace-empty-panel">
        <EmptyState icon="▣" title="Project management UI is ready" description="Projects are not stored by the current backend yet, so this view does not display sample or unsaved project records. Add project persistence to enable project creation, owners, and deadlines." />
      </section>
    </>
  );
}

function TeamView({ leads }) {
  return (
    <>
      <PageHeader section="team" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="♧" label="Registered accounts" value="—" detail="No team-directory API is configured" />
        <Metric icon="♙" label="Shared leads" value={leads.length} detail="Workspace-wide records" tone="purple-icon" />
        <Metric icon="◉" label="Access model" value="Shared" detail="Verified accounts share CRM data" tone="green-icon" />
        <Metric icon="⚙" label="Management" value="Admin" detail="Use the admin console to suspend accounts" tone="orange-icon" />
      </section>
      <section className="panel workspace-empty-panel">
        <EmptyState icon="♧" title="Team directory is not connected yet" description="This workspace shares CRM data across verified accounts, but the backend does not expose a member directory. Administrators can review and manage registered accounts from the admin console." action={<Link className="secondary-button" href="/admin/users">Open admin user management</Link>} />
      </section>
    </>
  );
}

function ReportsView({ leads }) {
  const statusCounts = leadStatuses.map((status) => ({
    label: status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
  const sources = ["Website", "Referral", "LinkedIn", "Other"].map((source) => ({
    label: source,
    count: leads.filter((lead) => lead.source === source).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((item) => item.count));

  return (
    <>
      <PageHeader section="reports" />
      <section className="stats-grid workspace-metrics">
        <Metric icon="♙" label="Total leads" value={leads.length} detail="Maximum 100 recent records" />
        <Metric icon="◈" label="Qualified pipeline" value={leads.filter((lead) => ["Qualified", "Proposal Sent"].includes(lead.status)).length} detail="Qualified and proposal stages" tone="purple-icon" />
        <Metric icon="↗" label="Won deals" value={leads.filter((lead) => lead.status === "Won").length} detail="Successfully converted" tone="green-icon" />
        <Metric icon="◷" label="Conversion rate" value={leads.length ? `${Math.round((leads.filter((lead) => lead.status === "Won").length / leads.length) * 100)}%` : "0%"} detail="Won leads from loaded records" tone="orange-icon" />
      </section>
      <div className="workspace-report-grid">
        <section className="panel workspace-report-panel">
          <div className="panel-heading"><div><h2>Pipeline by status</h2><p className="muted">Current distribution of loaded leads.</p></div></div>
          <div className="workspace-report-bars">
            {statusCounts.map((item) => <div className="workspace-report-bar" key={item.label}><div><span>{item.label}</span><strong>{item.count}</strong></div><span className="workspace-bar-track"><i style={{ width: `${(item.count / maxStatus) * 100}%` }} /></span></div>)}
          </div>
        </section>
        <section className="panel workspace-report-panel">
          <div className="panel-heading"><div><h2>Lead sources</h2><p className="muted">Origin of the prospects in this view.</p></div></div>
          <div className="source-legend workspace-source-legend">
            {sources.map((item) => <div key={item.label}><i className={`source-dot ${item.label.toLowerCase()}`} /><span>{item.label}</span><strong>{item.count}</strong></div>)}
          </div>
        </section>
      </div>
      <p className="workspace-data-note workspace-inline-note">Reports reflect the most recent 100 leads returned by the current CRM API, not a full historical export.</p>
    </>
  );
}

function SettingsView({ user }) {
  const [health, setHealth] = useState("Checking");
  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/health`, { credentials: "include" });
        const result = await response.json();
        if (!cancelled) setHealth(response.ok && result.success ? "Online" : "Unavailable");
      } catch {
        if (!cancelled) setHealth("Unavailable");
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <PageHeader section="settings" />
      <section className="panel workspace-settings-panel">
        <div className="panel-heading"><div><h2>Your profile</h2><p className="muted">Account identity associated with this session.</p></div></div>
        <dl className="workspace-settings-list">
          <div><dt>Name</dt><dd>{user?.name || "Workspace user"}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || "—"}</dd></div>
          <div><dt>Workspace access</dt><dd><StatusPill>Active</StatusPill></dd></div>
        </dl>
      </section>
      <section className="panel workspace-settings-panel">
        <div className="panel-heading"><div><h2>Service status</h2><p className="muted">Connection status only; secret configuration is never shown here.</p></div></div>
        <dl className="workspace-settings-list">
          <div><dt>CRM API</dt><dd><StatusPill>{health}</StatusPill></dd></div>
          <div><dt>Lead data</dt><dd>Shared workspace</dd></div>
          <div><dt>Account security</dt><dd>Password and email verification enabled</dd></div>
        </dl>
      </section>
      <div className="alert error-alert workspace-security-note" role="note">Account suspension and user access controls are available to administrators in the <Link href="/admin/users">admin user management</Link> page.</div>
    </>
  );
}

const views = {
  leads: LeadsView,
  contacts: ContactsView,
  companies: CompaniesView,
  deals: DealsView,
  tasks: TasksView,
  projects: ProjectsView,
  team: TeamView,
  reports: ReportsView,
  settings: SettingsView,
};

export default function WorkspaceApp({ section }) {
  const router = useRouter();
  const pathname = usePathname();
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const loadLeads = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/leads`, { credentials: "include" });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load CRM data.");
      }
      setLeads(result.data);
      setUser(result.user);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load CRM data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadLeads, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLeads]);

  async function logout() {
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      router.replace("/login");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to sign out.");
    }
  }

  const label = [...navigation, ...management, { href: "/settings", label: "Settings" }]
    .find((item) => item.href === pathname)?.label || pageInfo[section]?.title;
  const initials = (user?.name || "Workspace Admin").split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
  const Page = views[section];

  return (
    <main className="crm-shell">
      <aside className="sidebar">
        <Link href="/" className="brand"><span className="brand-mark">T</span><span><strong>TECHNOSKY</strong><small>CRM WORKSPACE</small></span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Workspace navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.label === "Leads" && <span className="nav-count">{leads.length}</span>}</Link>)}
        </nav>
        <div className="workspace-label management-label">MANAGEMENT</div>
        <nav className="nav-list" aria-label="Management navigation">
          {management.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="sidebar-bottom">
          <Link className={`nav-item ${pathname === "/settings" ? "active" : ""}`} href="/settings"><span className="nav-icon">⚙</span><span>Settings</span></Link>
          <div className="sidebar-user"><div className="avatar">{initials}</div><div className="user-info"><strong>{user?.name || "Workspace Admin"}</strong><small>Signed in</small></div></div>
        </div>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{label}</strong></div>
          <div className="topbar-actions"><label className="global-search"><span>⌕</span><input aria-label="Search leads" placeholder="Search CRM..." onKeyDown={(event) => { if (event.key === "Enter") router.push(`/leads?q=${encodeURIComponent(event.currentTarget.value)}`); }} /><kbd>↵</kbd></label><button className="secondary-button sign-out-button" onClick={logout}>Sign out</button><div className="avatar">{initials}</div></div>
        </header>
        <div className="page-content workspace-route-content">
          {error && <div className="alert error-alert" role="alert"><span>{error}</span><button onClick={loadLeads}>Retry</button></div>}
          {notice && <div className="alert success-alert" role="status">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
          {loading ? <section className="panel workspace-loading" aria-live="polite">Loading your workspace…</section> : Page ? <Page leads={leads} user={user} refresh={loadLeads} busy={busy} setBusy={setBusy} setError={setError} setNotice={setNotice} /> : null}
          <footer className="page-footer"><span>Technosky Solution · CRM Workspace</span><span>Shared workspace data · <Link href="/admin/login">Admin console</Link></span></footer>
        </div>
      </section>
    </main>
  );
}
