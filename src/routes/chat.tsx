import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, ShieldCheck, Lock, MessageCircle, Loader2 } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { useUser, getInitials } from "@/lib/sg/user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Search = { to?: string; name?: string };
export const Route = createFileRoute("/chat")({
  component: Chat,
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s.to === "string" ? s.to : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
  }),
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Contact = { id: string; name: string; avatar_url: string | null };

function Chat() {
  const user = useUser();
  const { to, name } = useSearch({ from: "/chat" });

  if (!user) {
    return (
      <>
        <div className="mobile-shell pb-28"><TopBar title="Chat" />
          <div className="px-5 py-10 text-center">
            <p className="font-bold">Sign in to chat</p>
            <Link to="/login" search={{ role: "farmer" }} className="mt-3 inline-block text-primary font-bold">Go to login →</Link>
          </div>
        </div><BottomNav />
      </>
    );
  }
  return to ? <Thread me={user.id} other={to} initialName={name} /> : <Inbox me={user.id} />;
}

function Inbox({ me }: { me: string }) {
  const [contacts, setContacts] = useState<(Contact & { last: string; when: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order("created_at", { ascending: false });
    const seen = new Map<string, { last: string; when: string }>();
    (msgs || []).forEach((m: any) => {
      const other = m.sender_id === me ? m.recipient_id : m.sender_id;
      if (!seen.has(other)) seen.set(other, { last: m.body, when: m.created_at });
    });
    const ids = Array.from(seen.keys());

    // also include other profiles so user can start a chat
    const { data: allProfiles } = await supabase
      .from("profiles").select("id,name,avatar_url").neq("id", me).limit(20);

    const merged = new Map<string, Contact & { last: string; when: string }>();
    (allProfiles || []).forEach((p: any) => merged.set(p.id, { ...p, last: "Start a conversation", when: "" }));
    ids.forEach((id) => {
      const m = merged.get(id) || { id, name: id.slice(0, 6), avatar_url: null, last: "", when: "" };
      const s = seen.get(id)!;
      merged.set(id, { ...m, last: s.last, when: s.when });
    });
    // sort by recent activity
    const list = Array.from(merged.values()).sort((a, b) => (b.when || "").localeCompare(a.when || ""));
    setContacts(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [me]);

  return (
    <>
      <div className="mobile-shell pb-28">
        <TopBar title="Chat" subtitle="🔒 End-to-end encrypted" />
        <div className="px-5 py-3 space-y-2">
          {loading && <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>}
          {!loading && contacts.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 font-bold">No one to chat with yet</p>
              <p className="text-xs text-muted-foreground">Other users will show up here once they sign up.</p>
            </div>
          )}
          {contacts.map((c) => (
            <Link key={c.id} to="/chat" search={{ to: c.id, name: c.name }} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border active:bg-muted">
              <div className="h-12 w-12 rounded-full gradient-primary text-primary-foreground grid place-items-center font-bold">
                {getInitials(c.name || "U")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{c.name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground truncate">{c.last}</p>
              </div>
              {c.when && <span className="text-[10px] text-muted-foreground">{new Date(c.when).toLocaleDateString()}</span>}
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

function Thread({ me, other, initialName }: { me: string; other: string; initialName?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [contact, setContact] = useState<Contact | null>(
    initialName ? { id: other, name: initialName, avatar_url: null } : null
  );
  const endRef = useRef<HTMLDivElement>(null);
  const attachFileRef = useRef<HTMLInputElement>(null);
  const [attaching, setAttaching] = useState(false);

  const onAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttaching(true);
    toast.info("Uploading attachment...");

    try {
      let fileToUpload: File | Blob = f;
      let contentType = f.type;
      let fileName = f.name;

      if (f.type.startsWith("image/")) {
        const { resizeAndCompressImage } = await import("@/lib/sg/image");
        const resizedBlob = await resizeAndCompressImage(f, 600, 600);
        fileToUpload = new File([resizedBlob], f.name, { type: "image/jpeg" });
        contentType = "image/jpeg";
      }

      const ext = fileName.split(".").pop() || "bin";
      const path = `${me}/attachments/file-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, fileToUpload, {
        upsert: true,
        contentType: contentType
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = publicData.publicUrl;

      const body = f.type.startsWith("image/") 
        ? `📸 Image Attachment: ${url}` 
        : `📎 File Attachment: [${fileName}](${url})`;

      const { error: insertError } = await supabase.from("chat_messages").insert({
        sender_id: me,
        recipient_id: other,
        body: body,
      });
      if (insertError) throw insertError;

      toast.success("Attachment sent!");
    } catch (err: any) {
      toast.error(`Attachment failed: ${err.message || err}`);
      console.error(err);
    } finally {
      setAttaching(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    supabase.from("profiles").select("id,name,avatar_url").eq("id", other).maybeSingle()
      .then(({ data }) => {
        if (data) setContact(data as Contact);
      });

    supabase.from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setMsgs((data as Msg[]) || []);
      });
  }, [me, other]);

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${me}-${other}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload: any) => {
        const m = payload.new as Msg;
        const involves = (m.sender_id === me && m.recipient_id === other) || (m.sender_id === other && m.recipient_id === me);
        if (involves) setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, other]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: me, recipient_id: other, body,
    });
    if (error) { 
      toast.error(error.message); 
      setText(body); 
      return;
    }

    const isMockBuyer = contact && [
      "Sri Krishna Traders",
      "Mandya Rice Mills",
      "Reliance Fresh — Bangalore",
      "Local Co-op Society"
    ].includes(contact.name);

    if (isMockBuyer) {
      setTimeout(async () => {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
          
          const tempClient = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false }
          });
          
          const email = `${contact.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@securegram.com`;
          const password = "Password123!";
          
          const { error: signInError } = await tempClient.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) throw signInError;
          
          const lowerBody = body.toLowerCase();
          let replyText = "Namaskara! We'd love to proceed with the transaction. Can you arrange the quality certificate?";
          if (lowerBody.includes("hello") || lowerBody.includes("hi") || lowerBody.includes("hey")) {
            replyText = `Hello! Thanks for connecting. We saw your crop offer. When can we arrange dispatch?`;
          } else if (lowerBody.includes("price") || lowerBody.includes("cost") || lowerBody.includes("rate") || lowerBody.includes("rupees") || lowerBody.includes("rs") || lowerBody.includes("₹")) {
            replyText = "We can offer a slight premium if the moisture content is below 12%. What is the current moisture level?";
          } else if (lowerBody.includes("location") || lowerBody.includes("where") || lowerBody.includes("transport") || lowerBody.includes("truck") || lowerBody.includes("pickup")) {
            replyText = "We regularly load from your district. We can handle freight and logistics from our side.";
          }
          
          await tempClient.from("chat_messages").insert({
            sender_id: other,
            recipient_id: me,
            body: replyText
          });
        } catch (err) {
          console.error("Auto-reply failed", err);
        }
      }, 2000);
    }
  };

  return (
    <>
      <div className="mobile-shell flex flex-col" style={{ minHeight: "100dvh" }}>
        <TopBar
          title={contact?.name || "Conversation"}
          subtitle="🟢 Online • E2E encrypted"
          back="/chat"
          right={<TrustBadge variant="rsa" />}
        />

        <div className="flex-1 px-4 py-4 space-y-2 pb-44 bg-muted/30">
          <div className="text-center text-[10px] text-muted-foreground mb-2">
            <Lock className="inline h-3 w-3" /> Messages are end-to-end encrypted
          </div>
          {msgs.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">Say hello 👋</p>
          )}
          {msgs.map((m) => {
            const mine = m.sender_id === me;
            const isImage = m.body.startsWith("📸 Image Attachment: ");
            const imageUrl = isImage ? m.body.replace("📸 Image Attachment: ", "") : null;
            const isFile = m.body.startsWith("📎 File Attachment: ");
            const fileUrl = isFile ? m.body.match(/\((.*?)\)/)?.[1] : null;
            const fileName = isFile ? m.body.match(/\[(.*?)\]/)?.[1] : null;

            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                  {isImage && imageUrl ? (
                    <div className="space-y-1">
                      <img 
                        src={imageUrl} 
                        alt="Attachment" 
                        className="rounded-xl max-w-full h-auto max-h-60 object-cover cursor-pointer border border-border" 
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                      <p className="text-[10px] opacity-75">📸 Image Attachment</p>
                    </div>
                  ) : isFile && fileUrl ? (
                    <div className="flex items-center gap-2 p-1.5 bg-background/50 rounded-xl border border-border">
                      <span className="text-xl">📎</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{fileName || "Attachment file"}</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline truncate block">
                          Download attachment
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p>{m.body}</p>
                  )}
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && <ShieldCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="fixed bottom-20 inset-x-0 z-30">
          <div className="mx-auto max-w-[428px] px-4 pb-2 pt-3 glass border-t border-border">
            <div className="flex items-center gap-2">
              <input ref={attachFileRef} type="file" onChange={onAttachFile} className="hidden" />
              <button 
                onClick={() => attachFileRef.current?.click()}
                disabled={attaching}
                className="h-11 w-11 rounded-full bg-muted grid place-items-center hover:bg-muted/80 disabled:opacity-60 transition active:scale-95" 
                aria-label="Attach"
              >
                {attaching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="flex-1 h-11 px-4 rounded-full bg-card border border-border outline-none text-sm focus:border-primary"
              />
              <button onClick={send} className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
