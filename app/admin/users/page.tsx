"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, RefreshCw, Save, ShieldCheck, Trash2, UserRoundCheck, Users } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "business_owner";
  created_at: string;
  business_count: number;
  last_sign_in_at: string | null;
  banned_until: string | null;
}

/** Determine whether Supabase still considers a user's ban active. */
function isBanned(user: AdminUser): boolean {
  return !!user.banned_until && Date.parse(user.banned_until) > Date.now();
}

/** Give the administrator profile, suspension, and deletion controls for users. */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  /** Refresh the service-role-backed user inventory. */
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/users");
    const body = await response.json().catch(() => ({}));
    if (response.ok) setUsers(body.users ?? []);
    else alert(body.error ?? "שגיאה בטעינת משתמשים");
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /** Keep editable profile fields local until the row's save button is used. */
  function updateLocal(id: string, updates: Partial<AdminUser>) {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...updates } : user));
  }

  /** Persist a user's display name and operational role. */
  async function saveProfile(user: AdminUser) {
    setBusyId(user.id);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_profile", name: user.name, role: user.role }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) alert(body.error ?? "שגיאה בשמירת המשתמש");
    setBusyId(null);
  }

  /** Suspend or restore authentication without deleting owned site data. */
  async function toggleBan(user: AdminUser) {
    const action = isBanned(user) ? "unban" : "ban";
    if (action === "ban" && !confirm(`לחסום את ${user.email} מכניסה לאתר?`)) return;
    setBusyId(user.id);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) updateLocal(user.id, { banned_until: body.banned_until ?? null });
    else alert(body.error ?? "שגיאה בעדכון החסימה");
    setBusyId(null);
  }

  /** Permanently remove the auth user and all database rows that cascade from it. */
  async function deleteUser(user: AdminUser) {
    const warning = `מחיקה לצמיתות של ${user.email} תמחק גם עסקים ותוכן בבעלותו. להמשיך?`;
    if (!confirm(warning)) return;
    setBusyId(user.id);
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setUsers((current) => current.filter((item) => item.id !== user.id));
    else alert(body.error ?? "שגיאה במחיקת המשתמש");
    setBusyId(null);
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DDEBE0] text-[#17402D]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl text-[#17402D]">משתמשים</h1>
            <p className="text-sm text-stone-500">{users.length} פרופילים · הרשאות, חסימה ומחיקה</p>
          </div>
        </div>
        <button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#17402D]/25 bg-white px-4 text-sm font-bold text-[#17402D]">
          <RefreshCw className="h-4 w-4" /> רענון
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-stone-500">טוען משתמשים...</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => {
            const banned = isBanned(user);
            const busy = busyId === user.id;
            return (
              <article key={user.id} className="brand-panel-soft bg-[#FFFDF7] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-950" dir="ltr">{user.email}</p>
                    <p className="mt-1 font-mono text-[10px] text-stone-400" dir="ltr">{user.id}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${banned ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                    {banned ? "חסום" : "פעיל"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-stone-600">
                    שם
                    <input value={user.name} onChange={(event) => updateLocal(user.id, { name: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-normal" />
                  </label>
                  <label className="text-xs font-bold text-stone-600">
                    תפקיד
                    <select value={user.role} onChange={(event) => updateLocal(user.id, { role: event.target.value as AdminUser["role"] })} className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-normal">
                      <option value="customer">לקוח</option>
                      <option value="business_owner">בעל עסק</option>
                    </select>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-500">
                  <span>{user.business_count} עסקים</span>
                  <span>נוצר: {new Date(user.created_at).toLocaleDateString("he-IL")}</span>
                  <span>כניסה: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("he-IL") : "אין"}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#17402D]/10 pt-4">
                  <button onClick={() => saveProfile(user)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#17402D] px-4 text-sm font-bold text-white disabled:opacity-50">
                    <Save className="h-4 w-4" /> שמירה
                  </button>
                  <button onClick={() => toggleBan(user)} disabled={busy} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50 ${banned ? "bg-[#DDEBE0] text-[#17402D]" : "bg-amber-100 text-amber-800"}`}>
                    {banned ? <UserRoundCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    {banned ? "החזרת גישה" : "חסימת כניסה"}
                  </button>
                  <button onClick={() => deleteUser(user)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-100 px-4 text-sm font-bold text-red-700 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" /> מחיקה מלאה
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#C3DCC9] bg-[#EFF5F0] p-4 text-sm text-[#17402D]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        חסימה משביתה כניסה אך שומרת את התוכן. מחיקה מלאה מוחקת את חשבון האימות ואת הרשומות התלויות בו.
      </div>
    </div>
  );
}
