import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile, copyFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const maxLatexBytes = 350_000;

export type CompileResult = {
  success: boolean;
  pdfPath: string;
  log: string;
  pageCount: number;
  warnings: string[];
};

export async function compileLatexToPdf(userId: string, latex: string): Promise<CompileResult> {
  if (Buffer.byteLength(latex, "utf8") > maxLatexBytes) {
    return {
      success: false,
      pdfPath: "",
      log: "LaTeX input exceeds the local compile size limit.",
      pageCount: 0,
      warnings: ["LaTeX input exceeds 350 KB."],
    };
  }

  const id = randomUUID();
  const tempDir = path.join(process.cwd(), ".tmp", "latex", id);
  const outputDir = path.join(process.cwd(), "public", "generated", userId);
  const outputFile = `${id}.pdf`;
  const outputPath = path.join(outputDir, outputFile);

  await mkdir(tempDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(tempDir, "resume.tex"), latex, "utf8");

  try {
    const { stdout, stderr } = await runLatexCompiler(tempDir);

    const pdfBuffer = await readFile(path.join(tempDir, "resume.pdf"));
    await copyFile(path.join(tempDir, "resume.pdf"), outputPath);
    const pageCount = countPdfPages(pdfBuffer);

    return {
      success: true,
      pdfPath: `/generated/${userId}/${outputFile}`,
      log: `${stdout}\n${stderr}`.trim(),
      pageCount,
      warnings: pageCount > 1 ? ["Compiled PDF is more than one page."] : [],
    };
  } catch (error) {
    const message = compileErrorMessage(error);
    return {
      success: false,
      pdfPath: "",
      log: message,
      pageCount: 0,
      warnings: ["LaTeX compile failed. Review the log and editable block changes."],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function runLatexCompiler(tempDir: string) {
  const preference = process.env.LATEX_COMPILER ?? "auto";

  if (preference === "local") {
    return runLocalLatex(tempDir);
  }

  if (preference === "docker") {
    return runDockerLatex(tempDir);
  }

  let dockerError: unknown = null;

  try {
    return await runDockerLatex(tempDir);
  } catch (error) {
    dockerError = error;
  }

  try {
    return await runLocalLatex(tempDir);
  } catch (error) {
    if (isCommandMissing(error)) {
      if (dockerError && !isCommandMissing(dockerError)) {
        throw dockerError;
      }

      throw new Error(
        "No LaTeX compiler is available. Install Docker Desktop so ApplyPilot can run texlive/texlive, or install latexmk/TeX Live locally.",
      );
    }

    throw error;
  }
}

function runDockerLatex(tempDir: string) {
  return execFileAsync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${tempDir}:/work`,
      "-w",
      "/work",
      "texlive/texlive",
      "latexmk",
      "-pdf",
      "-interaction=nonstopmode",
      "-halt-on-error",
      "resume.tex",
    ],
    { timeout: 180_000, maxBuffer: 4_000_000 },
  );
}

function runLocalLatex(tempDir: string) {
  return execFileAsync(
    "latexmk",
    ["-pdf", "-interaction=nonstopmode", "-halt-on-error", "resume.tex"],
    { cwd: tempDir, timeout: 60_000, maxBuffer: 2_000_000 },
  );
}

function isCommandMissing(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function compileErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const details = error as Error & { stdout?: string; stderr?: string };
    return [error.message, details.stdout, details.stderr].filter(Boolean).join("\n").trim();
  }

  return "Unknown LaTeX compile error";
}

function countPdfPages(pdf: Buffer) {
  const text = pdf.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return Math.max(matches?.length ?? 1, 1);
}
