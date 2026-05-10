import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Paperclip, ShieldCheck, X, Lock, Check } from "lucide-react";
import { TopBar } from "@/components/sg/TopBar";
import { BottomNav } from "@/components/sg/BottomNav";
import { TrustBadge } from "@/components/sg/Badge";
import { celebrate } from "@/lib/sg/confetti";

export const Route = createFileRoute("/chat")({ component: Chat });

type Msg = { from: "me" | "them"; text: string; time: string; signed?: boolean };

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "them", text: "Namaskara! I'm interested in your 12 quintals Sona Masuri.", time: "10:24" },
    { from: "me", text: "Namaskara 🙏 Yes, Grade A. RSA-signed listing.", time: "10:25", signed: true },
    { from: "them", text: "Can you do ₹2,400/q? Pickup tomorrow morning.", time: "10:27" },
    { from: "me", text: "₹2,380 final. Truck arrives by 8 AM.", time: "10:28", signed: true },
    { from: "them", text: "Deal. Please send signed contract.", time: "10:30" },
  ]);
  const [text, setText] = useState("");
  const [showContract, setShowContract] = useState(false);
  const [signing, setSigning] = useState<"idle" | "signing" | "done">("idle");

  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { from: "me", text, time: "10:31", signed: true }]);
    setText("");
  };

  const finalize = () => {
    setSigning("signing");
    setTimeout(() => { setSigning("done"); celebrate(); }, 1500);
  };

  return (
    <>
      <div className="mobile-shell flex flex-col" style={{ minHeight: "100dvh" }}>
        <TopBar
          title="Sri Krishna Traders"
          subtitle="🟢 Online • E2E encrypted"
          right={<TrustBadge variant="rsa" />}
        />

        <div className="flex-1 px-4 py-4 space-y-2 pb-44 bg-muted/30">
          <div className="text-center text-[10px] text-muted-foreground mb-2">
            <Lock className="inline h-3 w-3" /> Messages are end-to-end encrypted with RSA
          </div>
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} animate-fade-in`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.from === "me" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
                }`}
              >
                <p>{m.text}</p>
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  <span>{m.time}</span>
                  {m.signed && <ShieldCheck className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Composer + finalize */}
        <div className="fixed bottom-20 inset-x-0 z-30">
          <div className="mobile-shell px-4 pb-2 pt-3 glass border-t border-border">
            <button
              onClick={() => setShowContract(true)}
              className="w-full mb-2 h-11 rounded-2xl gradient-action text-action-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-card active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" /> Finalize Deal
            </button>
            <div className="flex items-center gap-2">
              <button className="h-11 w-11 rounded-full bg-muted grid place-items-center" aria-label="Attach"><Paperclip className="h-4 w-4" /></button>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
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

      {/* Contract modal */}
      {showContract && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end animate-fade-in" onClick={() => setShowContract(false)}>
          <div className="mobile-shell w-full" onClick={e => e.stopPropagation()}>
            <div className="rounded-t-3xl bg-card p-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Signed Contract</h3>
                <button onClick={() => setShowContract(false)} className="h-9 w-9 rounded-full bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-xs space-y-2 font-mono">
                <Row k="Seller" v="Pradeep Kumar (Mandya)" />
                <Row k="Buyer" v="Sri Krishna Traders" />
                <Row k="Crop" v="Sona Masuri Rice • Grade A" />
                <Row k="Quantity" v="12 quintal" />
                <Row k="Price" v="₹2,380 / q" />
                <Row k="Total" v="₹28,560" highlight />
                <Row k="Pickup" v="Tomorrow 08:00 AM" />
                <Row k="Tx hash" v="0xa9f3…b2c1" />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <TrustBadge variant="rsa" />
                <TrustBadge variant="tamper" />
              </div>

              <Link
                to="/transactions"
                onClick={(e) => {
                  if (signing === "idle") { e.preventDefault(); finalize(); setTimeout(() => setShowContract(false), 1800); }
                }}
                className="mt-5 w-full h-13 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elev flex items-center justify-center gap-2"
              >
                {signing === "idle" && (<><ShieldCheck className="h-5 w-5" /> Sign with RSA & Confirm</>)}
                {signing === "signing" && "Signing securely…"}
                {signing === "done" && (<><Check className="h-5 w-5 animate-check-pop" /> Deal Signed Securely!</>)}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-bold text-primary" : "font-semibold"}>{v}</span>
    </div>
  );
}
