"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-7xl px-6">
        <div
          className="
            mt-4 h-14
            flex items-center justify-between
            rounded-2xl
            border border-white/10
            bg-white/5
            backdrop-blur-md
            shadow-lg
          "
        >
          <span className="pl-5 text-lg font-semibold tracking-tight">
            SkillSync
          </span>
          <div className="pr-4">
            <AnimatedThemeToggler />
          </div>
        </div>
      </nav>
    </header>
  );
}
