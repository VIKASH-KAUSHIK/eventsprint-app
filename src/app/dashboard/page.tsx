"use client";

import { useState, useEffect } from "react";
import FuturisticBackground from "@/components/FuturisticBackground";

interface Member {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  skills?: string[];
}

interface TeamData {
  id: string;
  name: string;
  leaderId: string;
  inviteCode: string;
  track: string;
  maxMembers: number;
  isLocked: boolean;
  members: Member[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  primaryTrack: string;
  bio?: string;
}

const AVAILABLE_TECH_TAGS = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "PyTorch",
  "FastAPI",
  "MongoDB",
  "C++",
  "Rust",
  "Tailwind CSS",
  "Solidity",
  "Docker",
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"team" | "finder" | "audit">("team");

  // User Profile & Stack Modal
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTeam, setCurrentTeam] = useState<TeamData | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("AI & Distributed Systems");

  // Team Actions
  const [teamName, setTeamName] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // System Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // AI Match Finder
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Rubric Pre-check Form
  const [pitchForm, setPitchForm] = useState({
    title: "",
    tagline: "",
    track: "AI & Distributed Systems",
    pitchText: "",
  });
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated) {
          setUserProfile(data.user || null);
          setSelectedSkills(Array.isArray(data.user?.skills) ? data.user.skills : []);
          setSelectedTrack(data.user?.primaryTrack || "AI & Distributed Systems");
          setCurrentTeam(data.team || null);
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  useEffect(() => {
    refreshUserSession();
  }, []);

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await fetch("/api/teams/match");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.recommendations) ? data.recommendations : [];
        setMatches(list);
      }
    } catch (err) {
      console.error("Match fetch error:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (activeTab === "finder") {
      fetchMatches();
    }
  }, [activeTab]);

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSkillInput.trim()) {
      e.preventDefault();
      const val = customSkillInput.trim();
      if (!selectedSkills.includes(val)) {
        setSelectedSkills([...selectedSkills, val]);
      }
      setCustomSkillInput("");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: selectedSkills,
          primaryTrack: selectedTrack,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");

      showToast("Tech stack updated! Recalculating matches...", "success");
      setIsSkillModalOpen(false);
      await refreshUserSession();
      if (activeTab === "finder") fetchMatches();
    } catch (err: any) {
      showToast(err.message || "Update error", "error");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create team");

      setCreatedInviteCode(data.inviteCode);
      setTeamName("");
      showToast(`Team "${data.name}" initialized!`, "success");
      await refreshUserSession();
    } catch (err: any) {
      showToast(err.message || "Failed to create team", "error");
    }
  };

  const handleJoinTeam = async (codeToJoin?: string, targetTeamName?: string) => {
    const code = codeToJoin || inviteCodeInput;
    if (!code) {
      showToast("Please provide an invite code", "error");
      return;
    }

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to join team");

      showToast(`Enrolled into ${targetTeamName || data.team?.name || code}!`, "success");
      setInviteCodeInput("");
      await refreshUserSession();
      if (activeTab === "finder") fetchMatches();
    } catch (err: any) {
      showToast(err.message || "Failed to join team", "error");
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm(`Are you sure you want to leave ${currentTeam?.name}?`)) return;

    try {
      const res = await fetch("/api/teams/leave", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to leave team");

      showToast(`Left ${data?.teamName || "the team"}.`, "success");
      setCreatedInviteCode(null);
      await refreshUserSession();
      if (activeTab === "finder") fetchMatches();
    } catch (err: any) {
      showToast(err.message || "Failed to leave team", "error");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from team?`)) return;

    try {
      const res = await fetch("/api/teams/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to remove member");

      showToast(`${memberName} removed from squad`, "success");
      await refreshUserSession();
    } catch (err: any) {
      showToast(err.message || "Removal failed", "error");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast("Invite Code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEvaluate = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!pitchForm.title.trim()) {
      showToast("Project Title is required", "error");
      return;
    }
    if (!pitchForm.tagline.trim()) {
      showToast("Tagline is required", "error");
      return;
    }
    if (!pitchForm.pitchText.trim()) {
      showToast("Project writeup is required", "error");
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch("/api/submissions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pitchForm),
      });

      const rawText = await res.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (!res.ok) throw new Error(data?.error || `Evaluation failed (${res.status})`);

      setEvalResult(data.aiEvaluation || data);
      if (data.aiEvaluation?.overallScore === 0) {
        showToast("Low-effort or ungradeable writeup: Scored 0/100", "error");
      } else {
        showToast("Gemini rubric audit completed!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Evaluation error", "error");
    } finally {
      setEvaluating(false);
    }
  };

  const isLeader = Boolean(
    currentTeam && userProfile && currentTeam.leaderId === userProfile.id
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-mono relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <FuturisticBackground />

      {/* Floating Status Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce transition-all">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded border shadow-2xl backdrop-blur-md text-xs ${
              toast.type === "success"
                ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-cyan-500/20"
                : "bg-red-950/90 border-red-500 text-red-200 shadow-red-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === "success" ? "bg-cyan-400 animate-ping" : "bg-red-400"
              }`}
            />
            <span className="tracking-wide">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-zinc-400 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tech Stack Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-cyan-500/40 rounded-xl p-6 max-w-lg w-full flex flex-col gap-5 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase">Your Hacker Profile &amp; Stack</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Used by Gemini to calculate semantic team compatibility</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSkillModalOpen(false)}
                className="text-zinc-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-2">Hackathon Track Interest</label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="AI & Distributed Systems">AI &amp; Distributed Systems</option>
                <option value="FinTech & Web3">FinTech &amp; Web3</option>
                <option value="DevTools & Cloud Infrastructure">DevTools &amp; Cloud Infrastructure</option>
                <option value="Autonomous Agents & Robotics">Autonomous Agents &amp; Robotics</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-2">Selected Tech Stack &amp; Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {AVAILABLE_TECH_TAGS.map((tag) => {
                  const active = selectedSkills.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleSkill(tag)}
                      className={`text-xs px-2.5 py-1 rounded border transition-all cursor-pointer ${
                        active
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {tag} {active && "✓"}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={handleAddCustomSkill}
                placeholder="Type custom skill and hit Enter (e.g. Go, GraphQL)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setIsSkillModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-3 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-4 py-2 rounded transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl w-full mx-auto p-6 flex-1 flex flex-col gap-6 z-10">
        {/* User Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white">EventSprint Portal</h1>
            <p className="text-zinc-400 text-xs mt-1">
              Autonomous Hackathon Roster, Peer Discovery &amp; Rubric Engine
            </p>
          </div>

          {userProfile && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-bold">{userProfile.name}</span>
                    <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 rounded text-cyan-400 uppercase">
                      {userProfile.role}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">{userProfile.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap border-t sm:border-t-0 sm:border-l border-zinc-800 sm:pl-4 pt-2 sm:pt-0">
                {Array.isArray(userProfile.skills) && userProfile.skills.length > 0 ? (
                  userProfile.skills.slice(0, 3).map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-500">No skills set</span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(true)}
                  className="text-[10px] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Edit Stack
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Team Status Card */}
        {currentTeam ? (
          <div className="w-full bg-zinc-900/70 border border-cyan-500/40 rounded-lg p-5 flex flex-col gap-4 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {currentTeam.name}
                  </span>
                  <span className="text-xs bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    {currentTeam.members?.length || 0} / {currentTeam.maxMembers || 4} MEMBERS
                  </span>
                  {currentTeam.isLocked && (
                    <span className="text-[10px] bg-red-950/60 border border-red-500/40 text-red-300 px-2 py-0.5 rounded">
                      LOCKED
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-3 mt-1.5">
                  <span>Track: <span className="text-zinc-200">{currentTeam.track}</span></span>
                  <span>&bull;</span>
                  <span>
                    Invite Code: <span className="text-cyan-300 font-bold tracking-widest">{currentTeam.inviteCode}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentTeam.inviteCode)}
                  className="border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 text-xs px-3 py-2 rounded transition-all cursor-pointer"
                >
                  {copied ? "COPIED" : "SHARE CODE"}
                </button>
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  className="border border-red-500/40 hover:bg-red-500/20 text-red-400 text-xs px-3 py-2 rounded transition-all cursor-pointer"
                >
                  LEAVE TEAM
                </button>
              </div>
            </div>

            {/* Squad Members */}
            <div>
              <span className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                Current Squad Roster
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Array.isArray(currentTeam.members) &&
                  currentTeam.members.map((member) => {
                    const isSquadLead = member._id === currentTeam.leaderId;
                    const canKick = isLeader && member._id !== userProfile?.id;

                    return (
                      <div
                        key={member._id}
                        className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200 truncate">
                              {member.name || "Member"}
                            </span>
                            {isSquadLead && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded">
                                LEAD
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                            {member.email}
                          </span>
                        </div>

                        {canKick && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member._id, member.name || "member")}
                            className="mt-3 text-[10px] text-red-400 hover:text-red-300 underline text-left cursor-pointer"
                          >
                            Remove Member
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded p-4 text-xs text-zinc-400 flex items-center justify-between">
            <span>You are not currently enrolled in any squad. Create or join one below.</span>
            <span className="text-[10px] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
              UNASSIGNED
            </span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === "team" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            Team Formation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("finder")}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === "finder" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            AI Team Finder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`pb-3 transition-colors cursor-pointer ${
              activeTab === "audit" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            Pitch &amp; Rubric Audit
          </button>
        </div>

        {/* Tab 1: Formation */}
        {activeTab === "team" && (
          <div className="flex flex-col gap-6">
            {createdInviteCode && (
              <div className="w-full bg-cyan-950/40 border-2 border-cyan-400 p-5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 uppercase font-semibold">
                      New Team Initialized
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">Share this code with teammates to recruit them:</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-zinc-950 border border-cyan-500/60 px-4 py-2 rounded text-lg font-bold tracking-widest text-cyan-300 select-all">
                    {createdInviteCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(createdInviteCode)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-semibold px-4 py-2.5 rounded transition-all cursor-pointer"
                  >
                    COPY
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-lg">
                <h2 className="text-lg font-bold mb-4">Create New Team</h2>
                {currentTeam ? (
                  <div className="text-xs text-zinc-400 flex flex-col gap-3">
                    <p>You belong to squad <span className="text-white font-bold">{currentTeam.name}</span>.</p>
                    <button
                      type="button"
                      onClick={handleLeaveTeam}
                      className="w-fit border border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs px-4 py-2 rounded transition-colors cursor-pointer"
                    >
                      Leave Current Squad
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-zinc-400">Team Name</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Distributed Core"
                        className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold py-2 px-4 rounded text-sm transition-colors cursor-pointer"
                    >
                      Create Team
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-lg flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold mb-4">Join Team with Code</h2>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-zinc-400">Invite Code</label>
                      <input
                        type="text"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. INV-A1B2C3"
                        className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm outline-none focus:border-cyan-400 uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinTeam()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded text-sm transition-colors cursor-pointer"
                    >
                      Join via Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Team Finder */}
        {activeTab === "finder" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Gemini Semantic Team Suggestions</h2>
                <p className="text-xs text-zinc-400">
                  Scored based on your active stack ({Array.isArray(userProfile?.skills) ? userProfile?.skills.join(", ") : "Next.js, React"}) &amp; track complementarity.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(true)}
                  className="border border-cyan-500/40 text-cyan-300 text-xs px-3 py-1.5 rounded hover:bg-cyan-500/10 transition-colors cursor-pointer"
                >
                  Adjust Skills
                </button>
                <button
                  type="button"
                  onClick={fetchMatches}
                  disabled={loadingMatches}
                  className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
                >
                  {loadingMatches ? "Scanning..." : "Refresh Matches"}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Array.isArray(matches) && matches.length > 0 ? (
                matches.map((item) => {
                  const isMyTeam = currentTeam && currentTeam.id === (item.teamId || item._id);
                  const isFull = (item.membersCount || 0) >= (item.maxMembers || 4);

                  return (
                    <div
                      key={item.teamId || item.name}
                      className={`bg-zinc-900/70 border ${
                        isMyTeam ? "border-cyan-500/60 bg-cyan-950/20" : "border-zinc-800"
                      } p-5 rounded-lg flex flex-col justify-between gap-4 backdrop-blur-sm transition-all`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-white tracking-wide">{item.name}</span>
                            {isMyTeam && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                                YOUR SQUAD
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            {item.matchScore || 85}% Match
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80">
                          {item.reason || "Matched on track synergy and available roster capacity."}
                        </p>

                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase text-zinc-500 font-bold">Existing Stack:</span>
                            {Array.isArray(item.existingSkills) && item.existingSkills.length > 0 ? (
                              item.existingSkills.map((skill: string) => (
                                <span
                                  key={skill}
                                  className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-500">Next.js, Node.js</span>
                            )}
                          </div>

                          {Array.isArray(item.vacancies) && item.vacancies.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase text-amber-500/80 font-bold">Needs:</span>
                              {item.vacancies.map((vac: string) => (
                                <span
                                  key={vac}
                                  className="text-[10px] bg-amber-950/30 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded"
                                >
                                  {vac}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-1">
                          <span>
                            Invite Code: <span className="text-cyan-300 font-bold tracking-wider">{item.inviteCode || "OPEN"}</span>
                          </span>
                          <span className="text-zinc-400 font-semibold">
                            {item.membersCount || 1} / {item.maxMembers || 4} Members
                          </span>
                        </div>
                      </div>

                      {isMyTeam ? (
                        <button
                          type="button"
                          onClick={handleLeaveTeam}
                          className="w-full border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs py-2 rounded transition-colors cursor-pointer"
                        >
                          Leave This Squad
                        </button>
                      ) : isFull ? (
                        <button
                          type="button"
                          disabled
                          className="w-full bg-zinc-800/50 text-zinc-600 text-xs py-2 rounded cursor-not-allowed"
                        >
                          Squad Full
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinTeam(item.inviteCode, item.name)}
                          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs py-2 rounded transition-all font-semibold cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        >
                          Join Team
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 text-zinc-500 text-xs border border-zinc-800/80 rounded bg-zinc-950/50">
                  No other squads currently searching for members. Create your own team or check back shortly!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Pitch & Rubric Audit */}
        {activeTab === "audit" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-lg flex flex-col gap-4">
              <h2 className="text-lg font-bold">Submit Project for AI Audit</h2>

              <div>
                <label className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>Project Title</span>
                  <span className="text-red-400 text-[10px]">* Required</span>
                </label>
                <input
                  type="text"
                  value={pitchForm.title}
                  onChange={(e) => setPitchForm({ ...pitchForm, title: e.target.value })}
                  placeholder="e.g. SplitStream AI or X"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>Tagline</span>
                  <span className="text-red-400 text-[10px]">* Required</span>
                </label>
                <input
                  type="text"
                  value={pitchForm.tagline}
                  onChange={(e) => setPitchForm({ ...pitchForm, tagline: e.target.value })}
                  placeholder="e.g. Autonomous expense tracking and settlement engine"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-bold">
                  Hackathon Track <span className="text-red-400 text-[10px]">* Required</span>
                </label>
                <select
                  value={pitchForm.track}
                  onChange={(e) => setPitchForm({ ...pitchForm, track: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="AI & Distributed Systems">AI &amp; Distributed Systems</option>
                  <option value="FinTech & Web3">FinTech &amp; Web3</option>
                  <option value="DevTools & Cloud Infrastructure">DevTools &amp; Cloud Infrastructure</option>
                  <option value="Autonomous Agents & Robotics">Autonomous Agents &amp; Robotics</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>Project Writeup</span>
                  <span className="text-red-400 text-[10px]">* Required</span>
                </label>
                <textarea
                  rows={6}
                  value={pitchForm.pitchText}
                  onChange={(e) => setPitchForm({ ...pitchForm, pitchText: e.target.value })}
                  placeholder="Detail your architecture, stack, and hackathon impact..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm outline-none focus:border-cyan-400 resize-none"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleEvaluate}
                disabled={evaluating}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-semibold py-2.5 px-4 rounded text-sm transition-all cursor-pointer"
              >
                {evaluating ? "Auditing with Gemini..." : "Run Rubric Pre-Check"}
              </button>
            </div>

            {/* Scorecard Component */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-lg flex flex-col gap-4">
              <h2 className="text-lg font-bold">AI Evaluation Scorecard</h2>
              {evalResult ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-zinc-950 border border-cyan-500/30 rounded flex items-center justify-between">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider">Overall Hackathon Score</span>
                    <span
                      className={`text-2xl font-black ${
                        evalResult.overallScore === 0
                          ? "text-red-400"
                          : evalResult.overallScore < 50
                          ? "text-amber-400"
                          : "text-cyan-400"
                      }`}
                    >
                      {evalResult.overallScore || 0} / 100
                    </span>
                  </div>

                  {/* Suggested Names Section */}
                  {Array.isArray(evalResult.suggestedNames) && evalResult.suggestedNames.length > 0 && (
                    <div className="p-3.5 bg-zinc-950 border border-cyan-500/30 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                        AI Suggested Project Names (Click to Use):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {evalResult.suggestedNames.map((suggestedName: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPitchForm({ ...pitchForm, title: suggestedName })}
                            className="text-xs bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            + {suggestedName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                      Criterion Breakdown
                    </span>
                    {Array.isArray(evalResult.breakdown) &&
                      evalResult.breakdown.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 bg-zinc-950 border border-zinc-800/80 rounded flex flex-col gap-1"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-200 font-semibold">{item.criterion}</span>
                            <span
                              className={
                                item.score === 0
                                  ? "text-red-400 font-bold"
                                  : item.score < 50
                                  ? "text-amber-400"
                                  : "text-emerald-400 font-bold"
                              }
                            >
                              {item.score || 0} / 100
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            {item.feedback}
                          </p>
                        </div>
                      ))}
                  </div>

                  {Array.isArray(evalResult.recommendations) && (
                    <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
                      <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                        Judge Feedback &amp; Improvements
                      </span>
                      <ul className="list-disc list-inside text-xs text-zinc-300 mt-2 flex flex-col gap-1.5">
                        {evalResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-zinc-500 text-xs">
                  Run an evaluation on the left to see your real-time rubric breakdown.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}