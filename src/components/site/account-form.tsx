"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, LogIn, LogOut, UserPlus } from "lucide-react";

type AccountResult = { account: { email: string } | null; error?: string };

export function AccountForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<AccountResult>)
      .then((result) => setAccount(result.account))
      .catch((loadError: unknown) => { if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setError("Could not check sign-in status."); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as AccountResult;
      if (!response.ok || !result.account) throw new Error(result.error ?? "Could not sign in.");
      setAccount(result.account);
      setPassword("");
      setNotice(mode === "register" ? "Account created. Your current browser projects are now linked to this account." : "Signed in. Your projects are available on this AUTQORA server.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out.");
      setAccount(null);
      setEmail("");
      setNotice("You are signed out. Your saved projects remain on this AUTQORA server.");
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as { changed?: boolean; error?: string };
      if (!response.ok || !result.changed) throw new Error(result.error ?? "Could not change the password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed. Other signed-in sessions were ended.");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-2 h-11 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/70 focus-visible:ring-2 focus-visible:ring-violet/30";

  if (account) return (
    <section className="rounded-2xl border border-white/[0.1] bg-[#0a0810] p-6 sm:p-8">
      <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft">Account connected</p>
      <h2 className="mt-3 break-all font-display text-2xl text-mist">{account.email}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60">Projects created in this browser were linked to your account when you registered. Sign in from another browser that can reach this same AUTQORA server to open them.</p>
      {notice && <p role="status" className="mt-4 text-sm text-emerald-100/80">{notice}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-[#f58ba0]">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/projects" className="inline-flex h-10 items-center rounded-full bg-mist px-5 text-sm font-medium text-ink hover:bg-white">Open projects</Link><button type="button" onClick={() => void signOut()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/75 hover:bg-white/[0.05] disabled:opacity-50"><LogOut className="h-4 w-4" />{busy ? "Working" : "Sign out"}</button></div>
      <form onSubmit={(event) => void changePassword(event)} className="mt-8 border-t border-white/[0.08] pt-6">
        <h3 className="text-base font-medium text-white">Change password</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="current-password" className="block text-sm font-medium text-white/75">Current password</label><input id="current-password" type="password" autoComplete="current-password" required maxLength={256} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></div>
          <div><label htmlFor="new-password" className="block text-sm font-medium text-white/75">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /></div>
          <div><label htmlFor="confirm-password" className="block text-sm font-medium text-white/75">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></div>
        </div>
        <button type="submit" disabled={busy || newPassword.length < 12} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/85 hover:bg-white/[0.06] disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? "Saving" : "Update password"}</button>
      </form>
    </section>
  );

  return (
    <section className="rounded-2xl border border-white/[0.1] bg-[#0a0810] p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
        <button type="button" onClick={() => { setMode("login"); setError(""); }} aria-pressed={mode === "login"} className={`h-10 rounded-full text-sm ${mode === "login" ? "bg-white text-ink" : "text-white/60 hover:text-white"}`}>Sign in</button>
        <button type="button" onClick={() => { setMode("register"); setError(""); }} aria-pressed={mode === "register"} className={`h-10 rounded-full text-sm ${mode === "register" ? "bg-white text-ink" : "text-white/60 hover:text-white"}`}>Create account</button>
      </div>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <div><label htmlFor="account-email" className="block text-sm font-medium text-white/80">Email</label><input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="account-password" className="block text-sm font-medium text-white/80">Password</label><input id="account-password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 12 : 1} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />{mode === "register" && <p className="mt-1 text-xs text-white/45">Use at least 12 characters.</p>}</div>
        {error && <p role="alert" className="text-sm text-[#f58ba0]">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-100/80">{notice}</p>}
        <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mist text-sm font-medium text-ink hover:bg-white disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : mode === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{busy ? "Working" : mode === "register" ? "Create account" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-xs leading-relaxed text-white/45">Accounts and projects are stored on this AUTQORA server. Email verification and password recovery are not configured yet, so keep your password safe.</p>
    </section>
  );
}
