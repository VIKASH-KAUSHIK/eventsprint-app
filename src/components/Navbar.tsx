"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setIsAuthenticated(Boolean(data?.authenticated));
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLaunchApp = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (pathname === "/dashboard") {
      window.dispatchEvent(new CustomEvent("switch-dashboard-tab", { detail: "team" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsAuthenticated(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="w-full border-b border-cyan-500/20 bg-zinc-950/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,255,255,0.05)]">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-sm bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center font-mono text-cyan-400 font-bold group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all">
            &gt;_
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-extrabold tracking-widest text-white">
              EVENTSPRINT.AI
            </span>
            <span className="text-[10px] font-mono tracking-tighter text-cyan-400 border border-cyan-500/40 bg-cyan-950/40 px-1.5 py-0.5 rounded">
              PROTOCOL V2.5
            </span>
          </div>
        </Link>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-3 relative z-50 font-mono text-xs">
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 bg-zinc-900/60 px-3 py-2 rounded-sm transition-colors cursor-pointer"
          >
            LOGOUT
          </button>
        )}

        <button
          type="button"
          onClick={handleLaunchApp}
          className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold px-4 py-2 rounded-sm tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isAuthenticated ? "LAUNCH_APP" : "SIGN_IN"}</span>
          <span>&rarr;</span>
        </button>
      </div>
    </header>
  );
}