"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const ParticleNetwork = dynamic(() => import("@/components/ParticleNetwork"), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Interactive particle background */}
      <div className="fixed inset-0 overflow-hidden">
        <ParticleNetwork />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="max-w-4xl w-full flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            Talk to AI characters{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              that remember you
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-muted max-w-xl mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            Real-time voice and text conversations with persistent memory.
            Built with the Estuary Web SDK.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <Link
              href="/connect"
              className="group px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted">
          Powered by{" "}
          <a href="https://www.npmjs.com/package/@estuary-ai/sdk" target="_blank" rel="noopener noreferrer" className="text-accent-light font-medium hover:underline">@estuary-ai/sdk</a>
        </p>
      </footer>
    </div>
  );
}
