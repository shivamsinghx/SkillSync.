import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeSkillFit(input: {
  jobDescription: string;
  portfolioText: string;
}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
You are an expert technical recruiter.

Analyze the following job description and candidate portfolio.

Return ONLY valid JSON with this exact shape:
{
  "matchedSkills": string[],
  "missingSkills": string[],
  "highlightProject": string,
  "pitch": string
}

Job Description:
"""
${input.jobDescription}
"""

Portfolio:
"""
${input.portfolioText}
"""
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}
