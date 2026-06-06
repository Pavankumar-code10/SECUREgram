import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Chrome, User, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/google-signin")({
  component: GoogleSignIn,
});

function GoogleSignIn() {
  const [step, setStep] = useState<"choose" | "custom">("choose");
  const [customEmail, setCustomEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const accounts = [
    { name: "Pavan Kumar", email: "pavan.kumar@gmail.com", avatar: "PK" },
    { name: "Pavan Kumar (Work)", email: "pavan.kumar.work@gmail.com", avatar: "W" },
  ];

  const handleSelect = (email: string) => {
    setLoadingEmail(email);
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage(
          { type: "GOOGLE_OAUTH_SUCCESS", email },
          window.location.origin
        );
      }
      window.close();
    }, 800);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.includes("@")) return;
    handleSelect(customEmail);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[450px] bg-white border border-slate-200 rounded-lg shadow-md p-8 flex flex-col items-center">
        {/* Google Logo */}
        <svg className="h-6 mb-4" viewBox="0 0 24 24" width="74" height="24">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path
              fill="#EA4335"
              d="M20.64,12.2c0-0.63-0.06-1.25-0.16-1.84H12v3.49h4.84c-0.21,1.12-0.84,2.07-1.79,2.71v2.25h2.91 C19.65,17.21,20.64,14.92,20.64,12.2z"
            />
            <path
              fill="#4285F4"
              d="M12,21c2.43,0,4.47-0.81,5.96-2.19l-2.91-2.25c-0.81,0.54-1.84,0.87-3.05,0.87c-2.34,0-4.33-1.58-5.04-3.71 H3.97v2.32C5.46,18.99,8.5,21,12,21z"
            />
            <path
              fill="#FBBC05"
              d="M6.96,13.72c-0.18-0.54-0.28-1.12-0.28-1.72s0.1-1.18,0.28-1.72V7.96H3.97C3.35,9.17,3,10.55,3,12s0.35,2.83,0.97,4.04 L6.96,13.72z"
            />
            <path
              fill="#34A853"
              d="M12,6.38c1.32,0,2.51,0.45,3.44,1.35l2.58-2.58C16.46,3.68,14.43,3,12,3C8.5,3,5.46,5.01,3.97,7.96l2.99,2.32 C7.67,7.96,9.66,6.38,12,6.38z"
            />
          </g>
        </svg>

        <h1 className="text-xl font-medium text-slate-900 mt-2">Sign in with Google</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">to continue to SecureGram</p>

        {loadingEmail ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-4">Signing in as {loadingEmail}...</p>
          </div>
        ) : step === "choose" ? (
          <div className="w-full flex flex-col">
            {/* Account List */}
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {accounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelect(acc.email)}
                  className="w-full p-4 flex items-center hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs flex items-center justify-center mr-3">
                    {acc.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{acc.name}</p>
                    <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                  </div>
                </button>
              ))}

              <button
                onClick={() => setStep("custom")}
                className="w-full p-4 flex items-center hover:bg-slate-50 transition text-left text-sm text-blue-600 font-medium cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-blue-300 text-blue-600 flex items-center justify-center mr-3">
                  <User className="w-4 h-4" />
                </div>
                Use another account
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-6 text-center leading-normal">
              To continue, Google will share your name, email address, language preference, and profile picture with SecureGram.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="w-full flex flex-col">
            <div className="relative mb-6">
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Email or phone"
                className="w-full px-4 py-3 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition cursor-pointer flex items-center gap-1"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
