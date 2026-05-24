import { GoogleGenerativeAI } from "@google/generative-ai";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { applyMarkerBlockUpdates, extractMarkerBlocks } from "@/lib/resume-markers";

export type JobAnalysis = {
  companyName: string;
  jobTitle: string;
  location: string;
  employmentType: string;
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  matchScore: number;
  strongMatches: string[];
  weakMatches: string[];
  missingSkills: string[];
  sponsorshipSignals: string[];
  workAuthorization: {
    sponsorshipLikelihood: "yes" | "no" | "unknown";
    clearanceRequired: "yes" | "no" | "unknown";
    evidence: string[];
    recommendation: string;
  };
  resumeStrategy: {
    recommendedProfile: string;
    sectionsToEmphasize: string[];
    sectionsToReduce: string[];
    skillsToMoveUp: string[];
  };
};

export type CompanyResearch = {
  companyName: string;
  industry: string;
  productsOrServices: string;
  engineeringRelevance: string;
  whyThisCompany: string;
  recentNotes: string[];
  sources: string[];
};

export type ChangeSummary = {
  changedBlocks: Array<{
    block: string;
    changes: Array<{ before: string; after: string; reason: string }>;
  }>;
  unchanged: string[];
  warnings: string[];
};

const jobAnalysisShape: JobAnalysis = {
  companyName: "",
  jobTitle: "",
  location: "",
  employmentType: "",
  summary: "",
  responsibilities: [],
  requiredSkills: [],
  preferredSkills: [],
  keywords: [],
  matchScore: 0,
  strongMatches: [],
  weakMatches: [],
  missingSkills: [],
  sponsorshipSignals: [],
  workAuthorization: {
    sponsorshipLikelihood: "unknown",
    clearanceRequired: "unknown",
    evidence: [],
    recommendation: "No clear work authorization or clearance signal found in the job text.",
  },
  resumeStrategy: {
    recommendedProfile: "AI/ML | Backend | Full Stack | Cloud",
    sectionsToEmphasize: [],
    sectionsToReduce: [],
    skillsToMoveUp: [],
  },
};

export async function getGeminiApiKey(userId: string) {
  const secret = await prisma.userSecret.findUnique({
    where: { userId_provider: { userId, provider: "gemini" } },
  });

  if (!secret) {
    throw new Error("Add your Gemini API key in Settings before using AI features.");
  }

  return decryptSecret({
    encryptedValue: secret.encryptedValue,
    iv: secret.iv,
    authTag: secret.authTag,
  });
}

async function modelForUser(userId: string) {
  const apiKey = await getGeminiApiKey(userId);
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
}

async function generateJson<T>(userId: string, prompt: string, fallback: T): Promise<T> {
  const model = await modelForUser(userId);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function analyzeJob(userId: string, jobText: string, companyInfo?: CompanyResearch) {
  return generateJson<JobAnalysis>(
    userId,
    `Analyze this job for resume tailoring. Return only JSON matching this shape:
${JSON.stringify(jobAnalysisShape)}

Rules:
- Use only the supplied job content and optional public company notes.
- If data is missing, use empty strings or arrays.
- matchScore is 0-100 based on likely resume fit from the supplied content.
- For workAuthorization.sponsorshipLikelihood, use "yes" only when the job explicitly supports sponsorship, "no" only when it clearly rejects sponsorship or requires unrestricted work authorization, otherwise "unknown".
- For workAuthorization.clearanceRequired, use "yes" only when the job explicitly requires clearance/citizenship, "no" only when it clearly says no clearance is required, otherwise "unknown".
- Put exact short evidence snippets or paraphrases in workAuthorization.evidence.

Optional company context:
${JSON.stringify(companyInfo ?? null)}

Job content:
${jobText}`,
    jobAnalysisShape,
  );
}

export async function researchCompany(userId: string, companyName: string, publicText = "", source = "") {
  return generateJson<CompanyResearch>(
    userId,
    `Summarize public company context. Return only JSON with:
{
  "companyName": "",
  "industry": "",
  "productsOrServices": "",
  "engineeringRelevance": "",
  "whyThisCompany": "",
  "recentNotes": [],
  "sources": []
}

Company name: ${companyName}
Public source URL, if any: ${source}
Public page text:
${publicText.slice(0, 18_000)}`,
    {
      companyName,
      industry: "",
      productsOrServices: "",
      engineeringRelevance: "",
      whyThisCompany: "",
      recentNotes: [],
      sources: source ? [source] : [],
    },
  );
}

export async function extractResumeFacts(userId: string, latex: string) {
  return generateJson(
    userId,
    `Extract factual skills, projects, roles, dates, and technologies from this LaTeX resume.
Return JSON only. Do not infer facts that are not present.

Resume:
${latex.slice(0, 60_000)}`,
    { skills: [], projects: [], experience: [], warnings: [] },
  );
}

export async function tailorResume(userId: string, latex: string, jobAnalysis: JobAnalysis) {
  const blocks = extractMarkerBlocks(latex);
  if (blocks.length === 0) {
    throw new Error("No editable marker blocks found. Add % === NAME_START === and % === NAME_END === markers first.");
  }

  const response = await generateJson<{
    blocks: Record<string, string>;
    changeSummary: ChangeSummary;
  }>(
    userId,
    `Tailor this resume for the analyzed job, but edit ONLY approved marker block content.

Hard rules:
- Do not rewrite or return the full LaTeX document.
- Return JSON only with "blocks" and "changeSummary".
- "blocks" keys must exactly match approved block names.
- Edit only the professional summary and previous-job experience blocks that appear in the approved list.
- Preserve LaTeX commands, bullet style, tense, dates, company names, links, and formatting.
- Modify only summary text and previous-job bullet text inside existing marker content.
- Never invent experience or add skills absent from the supplied resume blocks.
- Make the resume feel maximally aligned with the job by foregrounding exact overlapping technologies, responsibilities, and outcomes already present in the resume.
- If a job requirement is not supported by the resume, do not fake it; instead emphasize the closest truthful adjacent experience.
- The output should read like a strong fit, but every claim must be defensible from the supplied resume blocks.
- Explain every change.
- Keep the resume one-page friendly and concise.

Approved editable blocks:
${JSON.stringify(blocks, null, 2)}

Job analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Required changeSummary shape:
{
  "changedBlocks": [
    {
      "block": "PROJECT_FIXROUTE",
      "changes": [
        {
          "before": "...",
          "after": "...",
          "reason": "Matched job requirement for TypeScript and AI routing"
        }
      ]
    }
  ],
  "unchanged": ["Template", "Margins", "Fonts", "Education", "Dates", "Links"],
  "warnings": []
}`,
    {
      blocks: {},
      changeSummary: {
        changedBlocks: [],
        unchanged: ["Template", "Margins", "Fonts", "Education", "Dates", "Links"],
        warnings: [],
      },
    },
  );

  const allowedNames = new Set(blocks.map((block) => block.name));
  const safeUpdates = Object.fromEntries(
    Object.entries(response.blocks ?? {}).filter(([name]) => allowedNames.has(name)),
  );

  return {
    tailoredLatex: applyMarkerBlockUpdates(latex, safeUpdates),
    changeSummary: {
      ...response.changeSummary,
      unchanged: response.changeSummary?.unchanged?.length
        ? response.changeSummary.unchanged
        : ["Template", "Margins", "Fonts", "Education", "Dates", "Links"],
      warnings: response.changeSummary?.warnings ?? [],
    },
  };
}

export async function shortenEditableBlocks(userId: string, latex: string, jobAnalysis: JobAnalysis) {
  const blocks = extractMarkerBlocks(latex);
  const response = await generateJson<{ blocks: Record<string, string>; warnings: string[] }>(
    userId,
    `The tailored resume compiled to more than one page. Shorten ONLY editable marker block content.
Return JSON only with "blocks" and "warnings". Keep all facts accurate and preserve LaTeX commands.

Editable blocks:
${JSON.stringify(blocks)}

Job analysis:
${JSON.stringify(jobAnalysis)}`,
    { blocks: {}, warnings: ["Automatic shortening did not return usable edits."] },
  );

  return {
    latex: applyMarkerBlockUpdates(latex, response.blocks ?? {}),
    warnings: response.warnings ?? [],
  };
}

export async function generateCoverLetter(userId: string, jobAnalysis: JobAnalysis, tailoredResume: string) {
  const response = await generateJson<{ content: string }>(
    userId,
    `Write a concise, professional cover letter. Use only facts present in the resume and job analysis.
Do not invent employers, achievements, degrees, dates, or personal details.
Return JSON only: {"content":"..."}.

Job analysis:
${JSON.stringify(jobAnalysis)}

Tailored resume:
${tailoredResume.slice(0, 60_000)}`,
    { content: "" },
  );

  return response.content;
}
