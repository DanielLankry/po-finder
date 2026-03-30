"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "po-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load on mount — from Supabase if logged in, else localStorage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("favorites")
          .select("business_id")
          .eq("user_id", user.id);
        if (!cancelled && data) {
          setFavorites(new Set(data.map((r: { business_id: string }) => r.business_id)));
        }
      } else {
        // Fallback to localStorage for unauthenticated users
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
        } catch {}
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(async (id: string) => {
    const supabase = createClient();

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      if (!userId) {
        // No user — persist to localStorage
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      }
      return next;
    });

    if (userId) {
      const isFav = favorites.has(id);
      if (isFav) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("business_id", id);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: userId, business_id: id });
      }
    }
  }, [userId, favorites]);

  const isFavorited = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, toggle, isFavorited, count: favorites.size, loading };
}
