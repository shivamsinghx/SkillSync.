import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSkillFit } from "@/lib/gemini";

type AnalyzeRequest = {
  jobDescription: string;
  portfolioText: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as AnalyzeRequest;
    const { jobDescription, portfolioText } = body;

    if (!jobDescription || !portfolioText) {
      return NextResponse.json(
        { error: "Job description and portfolio text are required" },
      { status: 400 }
    );
  }

  const analysis = await analyzeSkillFit({
      jobDescription,
      portfolioText,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);

    return NextResponse.json(
      { error: "Failed to analyze skill fit" },
      { status: 500 }
    );
  }
}
