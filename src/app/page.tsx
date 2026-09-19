import Link from "next/link";
import FuturisticBackground from "@/components/FuturisticBackground";

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex flex-col justify-between text-white font-mono selection:bg-cyan-500 selection:text-black">
      <FuturisticBackground />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 rounded-full text-xs text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>GEMINI 2.5 FLASH PROTOCOL ACTIVATED</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 uppercase">
          Autonomous Hackathon <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Roster &amp; Pitch Audit
          </span>
        </h1>

        <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed mb-10">
          Match with complementary hackathon peers, configure synchronized teams with unique invite codes,
          and conduct real-time AI rubric grading on your project writeups before submission deadlines.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-sm px-6 py-3 rounded-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2"
          >
            <span>LAUNCH DASHBOARD</span>
            <span>&rarr;</span>
          </Link>

          <Link
            href="/signup"
            className="border border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-semibold text-sm px-6 py-3 rounded-sm transition-all"
          >
            CREATE ACCOUNT
          </Link>

          <Link
            href="/login"
            className="border border-zinc-800 hover:border-zinc-600 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 text-sm px-6 py-3 rounded-sm transition-all"
          >
            SIGN IN
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full text-left">
          <div className="p-4 rounded border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="text-cyan-400 text-xs font-bold mb-1">01 // ROSTER SYNC</div>
            <p className="text-xs text-zinc-400">Generate cryptographic team tokens and join squads in one click.</p>
          </div>
          <div className="p-4 rounded border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="text-cyan-400 text-xs font-bold mb-1">02 // SEMANTIC MATCH</div>
            <p className="text-xs text-zinc-400">Pair with teammates based on track alignment and tech stack synergy.</p>
          </div>
          <div className="p-4 rounded border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
            <div className="text-cyan-400 text-xs font-bold mb-1">03 // RUBRIC PRE-CHECK</div>
            <p className="text-xs text-zinc-400">Audit pitches using multi-criterion Gemini 2.5 Flash rubric scoring.</p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-zinc-900 px-6 py-3 text-center text-xs text-zinc-600">
        <span>EVENTSPRINT.AI PROTOCOL &bull; TURBOPACK ENGINE READY</span>
      </footer>
    </div>
  );
}