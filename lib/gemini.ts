import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeSkillFit(input: {
  jobDescription: string;
  portfolioText: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local (get a key from https://aistudio.google.com/apikey)."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
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

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemini returned invalid JSON. Please try again or shorten your inputs."
    );
  }
}
