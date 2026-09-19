"use client";

export default function FuturisticBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* High-tech loop video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-25 filter contrast-125 brightness-75 scale-105"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-circuit-board-loop-animation-43958-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cyberpunk Scanline & Radial Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,rgba(0,0,0,0.85)_70%,rgba(0,0,0,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#083344_1px,transparent_1px),linear-gradient(to_bottom,#083344_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />
    </div>
  );
}