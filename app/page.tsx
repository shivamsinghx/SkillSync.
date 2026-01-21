"use client";

import { useState } from "react";
import Aurora from "@/components/Aurora";
import { Meteors } from "@/components/ui/meteors";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { AuthModal } from "@/components/ui/auth-modal";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground">
      
      
      <div className="pointer-events-none absolute bottom-[-8vh] left-0 w-full h-[45vh] overflow-hidden transform scale-y-[-1]">
  <Aurora
    colorStops={["#7cff67", "#B19EEF", "#5227FF"]}
    blend={0.5}
    amplitude={1.0}
    speed={1}
  />
</div>



      <Meteors number={40} />

      
      <div className="relative z-20 max-w-3xl text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          <TypingAnimation typeSpeed={80} className="inline-block">
            SkillSync.
          </TypingAnimation>
        </h1>

        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          See where you match. Fix what you don't.
        </p>

        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          SkillSync analyzes job requirements and compares them with your
          portfolio to identify skill gaps, highlight your strongest projects,
          and generate a tailored pitch that helps you stand out and get hired
          FASTER.
        </p>

        <div className="mt-8 flex justify-center">
          <RainbowButton
            className="px-5 py-4 text-base font-semibold"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Get started
          </RainbowButton>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}
