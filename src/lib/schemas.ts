import { z } from "zod";

export const geminiKeySchema = z.object({
  apiKey: z.string().trim().min(1, "Gemini API key is required").max(512),
});

export const resumeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  latex: z.string().trim().min(1, "LaTeX input is required").max(350_000),
});

export const jobSchema = z.object({
  jobDescription: z.string().trim().optional(),
  jobUrl: z.string().trim().url().optional().or(z.literal("")),
  query: z.string().trim().optional(),
});

export const analyzeSchema = z.object({});

export const tailorSchema = z.object({
  resumeId: z.string().min(1),
});

export const coverLetterSchema = z.object({});
