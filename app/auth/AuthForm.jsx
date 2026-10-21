"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegistration = mode === "register";
  const isAdmin = mode === "admin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const endpoint = isAdmin
        ? "/auth/admin/login"
        : isRegistration
        ? verificationStep
          ? "/auth/register/verify"
          : "/auth/register/request"
        : "/auth/login";
      const payload = isAdmin
        ? { username, password }
        : isRegistration
        ? verificationStep
          ? { email, otp }
          : { name, email, password }
        : { email, password };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to complete the request.");
      }

      if (isRegistration && !verificationStep) {
        setVerificationStep(true);
        setNotice(
          "If this email can be registered, a verification code has been sent."
        );
        return;
      }

      if (isRegistration) {
        router.replace("/");
        return;
      }

      router.replace(isAdmin ? "/admin/dashboard" : "/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete the request."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/auth/register/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send another code.");
      }

      setNotice(
        "If this email can be registered, a verification code has been sent."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send another code."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark">T</span>
          <span>
            <strong>TECHNOSKY</strong>
            <small>CRM WORKSPACE</small>
          </span>
        </Link>

        <div className="auth-heading">
          <p className="eyebrow">SECURE CRM ACCESS</p>
          <h1>
            {isAdmin
              ? "Administrator sign in"
              : isRegistration
              ? verificationStep
                ? "Verify your email"
                : "Create your account"
              : "Welcome back"}
          </h1>
          <p className="muted">
            {isAdmin
              ? "Sign in to manage the CRM workspace."
              : isRegistration
              ? verificationStep
                ? `Enter the six-digit code sent to ${email}.`
                : "Register with your work email to get started."
              : "Sign in to continue to your workspace."}
          </p>
        </div>

        {error && (
          <div className="alert error-alert" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="alert success-alert" role="status">
            {notice}
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {isRegistration && !verificationStep && (
            <label>
              Full name
              <input
                autoComplete="name"
                maxLength={80}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}

          {isAdmin && (
            <label>
              Admin username
              <input
                autoComplete="username"
                maxLength={80}
                onChange={(event) => setUsername(event.target.value)}
                required
                value={username}
              />
            </label>
          )}

          {!isAdmin && (!isRegistration || !verificationStep) && (
            <label>
              Email address
              <input
                autoComplete="email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
          )}

          {isRegistration && verificationStep && (
            <label>
              Verification code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                pattern="[0-9]{6}"
                required
                value={otp}
              />
            </label>
          )}

          {(!isRegistration || !verificationStep) && (
            <label>
              Password
              <input
                autoComplete={isRegistration ? "new-password" : "current-password"}
                maxLength={128}
                minLength={isRegistration ? 12 : 1}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              {isRegistration && (
                <small className="auth-help">Use at least 12 characters.</small>
              )}
            </label>
          )}

          <button className="primary-button auth-submit" disabled={busy}>
            {busy
              ? "Please wait..."
              : isAdmin
                ? "Sign in as admin"
                : isRegistration
                ? verificationStep
                  ? "Verify and create account"
                  : "Send verification code"
                : "Sign in"}
          </button>
        </form>

        {isRegistration && verificationStep && (
          <div className="auth-secondary-actions">
            <button
              className="auth-text-button"
              onClick={resendCode}
              disabled={busy}
              type="button"
            >
              Resend code
            </button>
            <button
              className="auth-text-button"
              onClick={() => {
                setVerificationStep(false);
                setOtp("");
                setNotice("");
              }}
              type="button"
            >
              Change registration details
            </button>
          </div>
        )}

        {isAdmin ? (
          <p className="auth-switch">
            <Link href="/login">Back to user sign in</Link>
          </p>
        ) : (
          <>
            <p className="auth-switch">
              {isRegistration ? "Already registered?" : "New to Technosky CRM?"}{" "}
              <Link href={isRegistration ? "/login" : "/register"}>
                {isRegistration ? "Sign in" : "Create an account"}
              </Link>
            </p>
            {!isRegistration && (
              <p className="auth-switch">
                <Link href="/admin/login">Administrator sign in</Link>
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
