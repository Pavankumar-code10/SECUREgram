import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export async function getAvatarUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (cache.has(path)) return cache.get(path)!;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}

export function useAvatarUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(null); return; }
    getAvatarUrl(path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);
  return url;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export function useSignedUrl(url?: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSignedUrl(null);
      return;
    }
    
    // If it's already a signed URL or local data url, keep it
    if (url.startsWith("data:") || url.includes("token=")) {
      setSignedUrl(url);
      return;
    }

    // Extract path from public Supabase URL if applicable
    let path = url;
    const match = url.match(/\/avatars\/(.+)$/);
    if (match) {
      path = match[1];
    }

    if (cache.has(path)) {
      setSignedUrl(cache.get(path)!);
      return;
    }

    let cancelled = false;
    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.signedUrl) {
          cache.set(path, data.signedUrl);
          setSignedUrl(data.signedUrl);
        } else {
          // Fall back to original url if sign fails
          setSignedUrl(url);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return signedUrl;
}

