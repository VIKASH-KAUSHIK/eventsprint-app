"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FuturisticBackground from "@/components/FuturisticBackground";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Refresh router so the global Navbar immediately catches the active auth state
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to authentication engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] relative flex flex-col items-center justify-center px-6 py-12 text-white font-mono selection:bg-cyan-500 selection:text-black">
      <FuturisticBackground />

      <div className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 rounded-full text-[10px] text-cyan-400 mb-3 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Security Gateway
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white">EventSprint</h1>
          <p className="text-zinc-400 text-xs mt-1">Welcome back to your hackathon portal</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-950/80 border border-red-500/50 rounded text-xs text-red-300 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg("")}
              className="text-red-400 hover:text-white ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5 tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded p-3 text-sm text-zinc-200 outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5 tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded p-3 text-sm text-zinc-200 outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 text-black font-bold py-3 rounded text-sm tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-cyan-400 hover:underline tracking-wide">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}