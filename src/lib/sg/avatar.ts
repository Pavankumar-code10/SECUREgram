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
