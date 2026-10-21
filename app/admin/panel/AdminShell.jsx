"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const navigation = [
  { href: "/admin/dashboard", icon: "▦", label: "Overview" },
  { href: "/admin/leads", icon: "♙", label: "Leads" },
  { href: "/admin/users", icon: "♧", label: "Users" },
  { href: "/admin/reports", icon: "▥", label: "Reports" },
  { href: "/admin/settings", icon: "⚙", label: "Settings" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/auth/session`, {
          credentials: "include",
        });
        const result = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || result.user?.role !== "admin") {
          router.replace("/admin/login");
          return;
        }

        setUser(result.user);
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Unable to verify the admin session. Check the backend and retry.");
          setReady(true);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [attempt, router]);

  async function signOut() {
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Sign out failed. Please try again.");
      }

      router.replace("/admin/login");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Sign out failed. Please try again."
      );
    }
  }

  const page = navigation.find((item) => item.href === pathname);

  if (!ready) {
    return (
      <main className="admin-loading" aria-live="polite">
        <span className="live-dot" />
        Checking administrator access…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-loading" role="alert">
        <div>
          <p>{error || "Administrator access is required."}</p>
          <button
            className="secondary-button"
            onClick={() => {
              setReady(false);
              setError("");
              setAttempt((current) => current + 1);
            }}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="crm-shell admin-shell">
      <aside className="sidebar">
        <Link href="/admin/dashboard" className="brand">
          <span className="brand-mark">T</span>
          <span>
            <strong>TECHNOSKY</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </Link>

        <div className="workspace-label">ADMINISTRATION</div>
        <nav className="nav-list" aria-label="Admin navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link className="nav-item" href="/">
            <span className="nav-icon">↗</span>
            User workspace
          </Link>
          <div className="sidebar-user">
            <div className="avatar">AD</div>
            <div className="user-info">
              <strong>Administrator</strong>
              <small>{user.username || user.email}</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Admin Console</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{page?.label || "Administration"}</strong>
          </div>
          <div className="topbar-actions">
            <span className="admin-secure-label">
              <span className="live-dot" />
              Secure session
            </span>
            <button className="secondary-button sign-out-button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <div className="page-content admin-content">
          {error && (
            <div className="alert error-alert" role="alert">
              {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}
