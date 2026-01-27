import { NextResponse } from "next/server";

type AnalyzeRequest = {
  jobDescription: string;
  portfolioText: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;

    const { jobDescription, portfolioText } = body;

    if (!jobDescription || !portfolioText) {
      return NextResponse.json(
        { error: "Job description and portfolio text are required." },
        { status: 400 }
      );
    }

    const jobSkills = ["React", "Next.js", "Tailwind", "Node.js"];
    const portfolioSkills = ["React", "Next.js", "Tailwind"];

    const matchedSkills = jobSkills.filter(skill =>
      portfolioSkills.includes(skill)
    );

    const missingSkills = jobSkills.filter(
      skill => !portfolioSkills.includes(skill)
    );

    const response = {
      matchedSkills,
      missingSkills,
      highlightProject: "SkillSync UI Platform",
      pitch: `Hi there! I reviewed your job posting and noticed you're looking for a frontend-focused developer with strong React and Next.js experience. I've built responsive, modern interfaces using Tailwind and component-driven design. While I’m currently strengthening my Node.js backend experience, I’m confident in delivering high-quality results for this role.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
