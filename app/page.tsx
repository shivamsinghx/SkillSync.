"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Aurora from "@/components/Aurora";
import { Meteors } from "@/components/ui/meteors";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { AuthModal } from "@/components/ui/auth-modal";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type AnalysisResult = {
  id?: string;
  matchedSkills: string[];
  missingSkills: string[];
  highlightProject: string;
  pitch: string;
  createdAt?: string;
};

type HistoryItem = AnalysisResult & {
  id: string;
  createdAt: string;
  jobDescription: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const searchParams = useSearchParams();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ usedToday?: number; limit?: number | null; plan?: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.items ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  async function handleAnalyze() {
    if (!jobDescription || (!resumeText && !resumeFile)) {
      setError("Add a job description (or link) and upload your resume (or paste it).");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let jobDescriptionToUse = jobDescription.trim();

      if (/^https?:\/\//i.test(jobDescriptionToUse)) {
        const scrapeRes = await fetch("/api/scrape-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: jobDescriptionToUse }),
        });

        if (!scrapeRes.ok) {
          const scrapeErr = await scrapeRes.json().catch(() => ({}));
          setError(
            scrapeErr.error ||
              "Couldn't extract the job description from that link. Try pasting the text instead."
          );
          return;
        }

        const scraped = await scrapeRes.json();
        jobDescriptionToUse = scraped.jobDescription || jobDescriptionToUse;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription: jobDescriptionToUse,
          portfolioText: resumeText,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429 && err.code === "LIMIT_REACHED") {
          setError(`You've hit the daily limit of ${err.limit} analyses on the free plan.`);
        } else {
          setError(err.error || "Something went wrong while analyzing.");
        }
        return;
      }

      const data = await res.json();
      setAnalysisResult(data);
      setUsageInfo({
        usedToday: data.usedToday,
        limit: data.limit,
        plan: data.plan,
      });
      await loadHistory();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while analyzing.");
    } finally {
      setLoading(false);
    }
  }

  function handleGetStarted() {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
  }

  function handleAuthSuccess() {
    setIsAuthModalOpen(false);
  }

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setIsAuthModalOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, loadHistory]);

  const handleCopyPitch = async () => {
    if (!analysisResult?.pitch) return;
    try {
      await navigator.clipboard.writeText(analysisResult.pitch);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJson = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillsync-analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!analysisResult) return;
    const md = [
      "# SkillSync Analysis",
      "",
      "## Matched skills",
      ...(analysisResult.matchedSkills ?? []).map((s) => `- ${s}`),
      "",
      "## Missing skills",
      ...(analysisResult.missingSkills ?? []).map((s) => `- ${s}`),
      "",
      "## Highlight project",
      "",
      analysisResult.highlightProject,
      "",
      "## Pitch",
      "",
      analysisResult.pitch,
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillsync-analysis.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || (session?.user?.email?.[0] || "?").toUpperCase();

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

      <Meteors number={30} />

      {isAuthenticated && session?.user && (
        <header className="pointer-events-none fixed top-4 right-4 z-30">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-500 text-xs font-semibold text-white overflow-hidden">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || session.user.email || "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => signOut()}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}

      <div className="relative z-20 max-w-5xl w-full px-6 py-10 md:py-16">
        <div className="text-center max-w-3xl mx-auto">
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
            FASTERRR.
          </p>

          {!isAuthenticated && (
            <div className="mt-8 flex justify-center">
              <RainbowButton
                className="px-5 py-4 text-base font-semibold"
                onClick={handleGetStarted}
              >
                Get started
              </RainbowButton>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
            <div className="rounded-2xl border border-white/20 bg-background/20 backdrop-blur-xl p-6 md:p-7 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">Describe the role</h2>
                {usageInfo && usageInfo.limit && (
                  <span className="text-xs rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    {usageInfo.usedToday ?? 0}/{usageInfo.limit} analyses today (free)
                  </span>
                )}
              </div>

              <label className="block text-sm font-medium mb-1">
                Job description
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[120px] resize-y"
                placeholder="Paste the job description or a job post URL here"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Upload resume (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/80 cursor-pointer"
                  />
                  {resumeFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selected: {resumeFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    or paste your portfolio/resume
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[80px] resize-y"
                    placeholder="Paste bullets, projects, or your resume text.."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-between items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {session?.user?.plan === "PRO" && "You're on the Pro plan – no daily limits."}
                </div>
                <RainbowButton
                  className="px-5 py-3 text-sm font-semibold"
                  onClick={handleAnalyze}
                >
                  {loading ? "Analyzing..." : "Analyze my fit"}
                </RainbowButton>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/20 bg-background/20 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-black/30 min-h-[180px] flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold">Results</h2>
                </div>

                {!analysisResult && (
                  <p className="text-sm text-muted-foreground">
                    Run an analysis to see matched skills, gaps, and a tailored pitch.
                  </p>
                )}

                {analysisResult && (
                  <div className="space-y-4 text-left">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-2">
                          Matched skills
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.matchedSkills?.length ? (
                            analysisResult.matchedSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 px-2 py-0.5 text-xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No strong matches detected yet.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-2">
                          Missing skills
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.missingSkills?.length ? (
                            analysisResult.missingSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-amber-500/10 text-amber-100 border border-amber-500/20 px-2 py-0.5 text-xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No major gaps flagged.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                        Highlight project
                      </h3>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">
                        {analysisResult.highlightProject || "Your best-fit project will appear here."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Pitch
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCopyPitch}
                            className="text-xs rounded-md border border-border bg-background/80 px-2 py-1 hover:bg-background"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={handleExportMarkdown}
                            className="text-xs rounded-md border border-border bg-background/80 px-2 py-1 hover:bg-background"
                          >
                            Export MD
                          </button>
                          <button
                            type="button"
                            onClick={handleExportJson}
                            className="text-xs rounded-md border border-border bg-background/80 px-2 py-1 hover:bg-background"
                          >
                            Export JSON
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-foreground/90 whitespace-pre-line max-h-52 overflow-y-auto">
                        {analysisResult.pitch || "A tailored pitch for this role will appear here."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/20 bg-background/20 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-black/30 max-h-[260px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold">Recent analyses</h2>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Last {history.length} runs
                  </span>
                </div>
                {history.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your latest analyses will show up here once you start using SkillSync.
                  </p>
                )}
                <ul className="space-y-2 text-sm">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 hover:bg-background cursor-default"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">
                          {item.jobDescription}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Matched {item.matchedSkills?.length ?? 0} • Missing{" "}
                        {item.missingSkills?.length ?? 0}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}

