"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MailCheck } from "lucide-react";

/** Fragments stay out of server/access logs; clear the token from the address bar after reading it. */
export function ConfirmEmailForm() {
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const hasReadToken = useRef(false);
  useEffect(() => {
    const readToken = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get("token_hash") ?? "";
      window.history.replaceState(window.history.state, "", window.location.pathname);
      setTokenHash(token);
    };
    // Strict Mode replays effects; the initial fragment must only be consumed once.
    if (!hasReadToken.current) {
      hasReadToken.current = true;
      // Initialize from the external browser URL after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      readToken();
    }
    // Opening a new email link in this same tab may only change the fragment.
    window.addEventListener("hashchange", readToken);
    return () => window.removeEventListener("hashchange", readToken);
  }, []);
  const validToken = tokenHash !== null && /^[a-zA-Z0-9_-]{32,256}$/.test(tokenHash);
  return (
    <main className="brand-canvas flex min-h-screen items-center justify-center px-5 py-10" dir="rtl">
      <section className="brand-panel w-full max-w-[460px] space-y-6 p-6 text-center sm:p-9">
        <Link href="/" className="inline-flex"><Image src="/logo.png" alt="פה קרוב — דף הבית" width={56} height={56} /></Link>
        <MailCheck className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
        <h1 className="font-display text-4xl text-ink">{tokenHash === null ? "מכינים את אימות המייל…" : validToken ? "מאמתים וממשיכים" : "קישור האימות אינו תקין"}</h1>
        <p className="text-sm leading-relaxed text-stone-600">{validToken
          ? "לחצו על הכפתור כדי לאמת את כתובת המייל ולהמשיך לחשבון שלכם."
          : "נסו לפתוח את הקישור המלא מהמייל, או היכנסו לחשבון כדי לבקש קישור חדש."}</p>
        {tokenHash === null ? <p role="status">טוענים את הקישור…</p> : validToken ? (
          <form action="/auth/callback" method="post">
            <input type="hidden" name="token_hash" value={tokenHash ?? ""} />
            <button className="brand-button min-h-12 w-full rounded-xl px-4 font-bold" type="submit">אימות המייל וכניסה לחשבון</button>
          </form>
        ) : <Link className="brand-button inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-bold" href="/auth/login">חזרה לכניסה</Link>}
      </section>
    </main>
  );
}
