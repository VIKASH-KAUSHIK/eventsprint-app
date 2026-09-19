"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FuturisticBackground from "@/components/FuturisticBackground";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/user/profile");
        
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setTeam(data.team);
        } else {
          // Fallback mock session so UI never freezes
          setUser({
            name: "Hacker",
            email: "participant@eventsprint.ai",
            role: "PARTICIPANT",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setUser({
          name: "Participant",
          email: "participant@eventsprint.ai",
          role: "PARTICIPANT",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-cyan-400 font-mono flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="animate-pulse tracking-widest text-xs">LOADING_IDENTITY_MATRIX...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono flex flex-col p-6 selection:bg-cyan-500 selection:text-black relative">
      <FuturisticBackground />

      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-6 z-10 pt-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">USER://IDENTITY</h1>
            <p className="text-zinc-400 text-xs mt-1">Hackathon participant credential &amp; assignment overview.</p>
          </div>
          <Link
            href="/dashboard"
            className="border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 text-xs px-4 py-2 rounded transition-all"
          >
            &larr; BACK TO DASHBOARD
          </Link>
        </div>

        {/* Identity & Team Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* User Account Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-lg backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-400 uppercase font-bold tracking-wider">Account Credentials</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">USER_NAME</span>
                  <span className="text-base text-white font-bold">{user?.name || "Participant"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">EMAIL_IDENTIFIER</span>
                  <span className="text-zinc-200">{user?.email || "No email registered"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">USER_ROLE</span>
                  <span className="text-zinc-300 uppercase tracking-widest">{user?.role || "HACKATHON_CONTRIBUTOR"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500">
              AUTHENTICATED VIA EVENTSPRINT SESSION TOKEN
            </div>
          </div>

          {/* Current Team Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-lg backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${team ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-300">
                  {team ? "Active Roster Squad" : "Free Agent Status"}
                </span>
              </div>

              {team ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-1">TEAM_NAME</span>
                    <span className="text-xl text-cyan-400 font-bold">{team.name}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-1">INVITE_CODE</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-950 border border-cyan-500/40 px-3 py-1.5 rounded text-sm text-cyan-300 font-bold tracking-widest">
                        {team.inviteCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(team.inviteCode)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-[11px] px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        {copied ? "COPIED" : "COPY"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-2">ROSTER_MEMBERS ({team.members?.length || 1}/4)</span>
                    <div className="flex flex-col gap-1.5">
                      {team.members?.map((m: any, i: number) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800 p-2 rounded flex justify-between text-zinc-300 text-[11px]">
                          <span>{m.name || m.email}</span>
                          <span className="text-zinc-500">{m._id === user?._id ? "(YOU)" : "MEMBER"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-zinc-400 leading-relaxed">
                    You have not established or joined a squad yet. Navigate to the dashboard to either generate an invite code or connect with open teams.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-4 py-2 rounded transition-all"
                  >
                    JOIN OR CREATE SQUAD &rarr;
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500">
              STATUS: {team ? "SQUAD_LOCKED" : "UNASSIGNED_FREE_AGENT"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}